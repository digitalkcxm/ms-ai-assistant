build:
	- docker build -f ./Dockerfile-prod -t ms-ai-assistant-container:latest .
start:
	- docker run -p 8080:5060 --name ms-ai-assistant-container -d ms-ai-assistant-container:latest
exec:
	- docker exec -it ms-ai-assistant-container /bin/sh
logs:
	- docker logs -f --tail 50 --timestamps ms-ai-assistant-container%%