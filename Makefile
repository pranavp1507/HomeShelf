.PHONY: help dev dev-build dev-down dev-logs prod prod-down test clean

# Default target - show help
help:
	@echo "Mulampuzha Library Management System - Make Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment (simple, no HTTPS)"
	@echo "  make dev-build    - Rebuild and start development environment"
	@echo "  make dev-down     - Stop development environment"
	@echo "  make dev-logs     - Show development logs"
	@echo ""
	@echo "Advanced (with Traefik):"
	@echo "  make advanced     - Start with Traefik reverse proxy (HTTPS)"
	@echo "  make advanced-down - Stop advanced environment"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-down    - Stop production environment"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run backend tests"
	@echo "  make test-watch   - Run tests in watch mode"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean        - Remove all containers, volumes, and images"
	@echo "  make backup       - Backup database"
	@echo "  make psql         - Connect to PostgreSQL shell"

# Development commands (simple setup, recommended)
dev:
	docker-compose -f compose.dev.yml up

dev-build:
	docker-compose -f compose.dev.yml up --build

dev-down:
	docker-compose -f compose.dev.yml down

dev-logs:
	docker-compose -f compose.dev.yml logs -f

# Advanced commands (with Traefik)
advanced:
	@echo "⚠️  Warning: This requires proper Traefik setup."
	@echo "See docs/platform_compatibility_analysis.md for details."
	docker-compose up

advanced-down:
	docker-compose down

# Production commands
prod:
	docker-compose -f compose.prod.yml up -d

prod-down:
	docker-compose -f compose.prod.yml down

# Testing commands
test:
	cd server && pnpm test

test-watch:
	cd server && pnpm run test:watch

# Utility commands
clean:
	@echo "⚠️  This will remove all containers, volumes, and images!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f compose.dev.yml down -v; \
		docker-compose down -v; \
		docker-compose -f compose.prod.yml down -v; \
	fi

backup:
	docker-compose -f compose.dev.yml exec postgres pg_dump -U user library > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created: backup_$$(date +%Y%m%d_%H%M%S).sql"

psql:
	docker-compose -f compose.dev.yml exec postgres psql -U user -d library

# Help is default
.DEFAULT_GOAL := help
