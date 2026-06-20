package routes

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"cw5/backend/internal/config"
	"cw5/backend/internal/handlers"
	"strings"
)

func Setup() *gin.Engine {
	r := gin.Default()

	origins := strings.Split(config.AppConfig.AllowedOrigins, ",")
	r.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	handler := handlers.NewPackageHandler()

	api := r.Group("/api/v1")
	{
		api.GET("/health", handler.Health)

		api.POST("/scan", handler.HandleScan)
		api.POST("/weigh", handler.HandleWeigh)

		packages := api.Group("/packages")
		{
			packages.POST("/forecast", handler.CreateForecast)
			packages.GET("/forecast/:tracking_number", handler.GetForecast)
			packages.GET("/history", handler.GetCheckHistory)
			packages.GET("/recent", handler.GetRecentPackages)
		}

		gates := api.Group("/gates")
		{
			gates.POST("/control", handler.ControlGate)
			gates.GET("/state/:gate_id", handler.GetGateState)
		}
	}

	r.GET("/ws", handler.WebSocket)

	return r
}
