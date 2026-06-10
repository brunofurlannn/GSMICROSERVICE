Solar Shield - Sistema de Monitoramento de Clima Espacial
Descrição da solução

O Solar Shield é um sistema de microsserviços desenvolvido para monitoramento de clima espacial. A aplicação realiza a ingestão de dados reais da NASA, utilizando a API DONKI, classifica riscos de tempestades geomagnéticas com base no índice Kp e disponibiliza alertas para operadores de infraestrutura crítica.

A solução utiliza uma arquitetura distribuída com microsserviços independentes, comunicação assíncrona via RabbitMQ, cache com Redis, API Gateway com Nginx e testes automatizados para validação das regras de negócio.

Proposta da aplicação

A proposta da aplicação é oferecer um sistema resiliente e escalável para apoiar o monitoramento de eventos de clima espacial que possam impactar infraestruturas críticas, como redes elétricas, sistemas de comunicação, satélites e operações sensíveis.

O sistema coleta dados de tempestades geomagnéticas da NASA, processa os eventos recebidos, classifica a severidade do risco e gera alertas com base nas regras de negócio definidas.

Arquitetura

A aplicação é composta por dois microsserviços principais:

Ingestion Service: responsável por buscar dados da NASA DONKI e publicar eventos no RabbitMQ.
Alert Service: responsável por consumir eventos do RabbitMQ, aplicar regras de negócio, descartar eventos duplicados e disponibilizar alertas pela API.

Além dos microsserviços, a solução utiliza:

RabbitMQ para comunicação assíncrona entre serviços.
Redis para cache do endpoint de alertas.
Nginx como API Gateway e proxy reverso com rate limiting.
k6 para smoke test.
Docker Compose para subir toda a infraestrutura.
Diagrama da arquitetura
flowchart TD
    A[Cliente / Operador] --> B[Nginx API Gateway]

    B --> C[Ingestion Service]
    B --> D[Alert Service]

    C --> E[NASA DONKI API]
    C --> F[RabbitMQ]

    F --> D

    D --> G[Redis Cache]
    D --> H[Alertas Processados]

    I[k6 Smoke Test] --> B
Regras de negócio
RN1 - Severidade de tempestade geomagnética

A classificação da severidade é feita com base no índice Kp:

Kp menor ou igual a 4: low
Kp entre 5 e 7: moderate
Kp maior ou igual a 8: severe

Quando a severidade for severe, o campo emergencyNotification deve ser definido como true.

RN3 - Idempotência

Eventos com o mesmo event_id recebidos mais de uma vez devem ser descartados. O sistema registra log indicando que o evento duplicado foi ignorado.

Exemplo de log:

[Idempotencia] Evento duplicado descartado: 2026-05-15T21:00:00-GST-001
Tecnologias utilizadas
Node.js
Express
Docker
Docker Compose
RabbitMQ
Redis
Nginx
k6
NASA DONKI API
Estrutura do projeto
.
├── docker-compose.yml
├── nginx.conf
├── README.md
├── k6
│   └── smoke-test.js
└── src
    ├── ingestion-service
    │   └── src
    └── alert-service
        └── src
Como executar o projeto
1. Clonar o repositório
git clone URL_DO_REPOSITORIO
cd NOME_DA_PASTA_DO_PROJETO
2. Subir a aplicação com Docker Compose
docker compose up --build

Esse comando sobe todos os serviços necessários:

Nginx
Ingestion Service
Alert Service
RabbitMQ
Redis
Endpoints da API

A API deve ser acessada pelo API Gateway na porta 8080.

Health check
curl http://localhost:8080/health

Resposta esperada:

Solar Shield Gateway OK
Disparar ingestão da NASA
curl -X POST http://localhost:8080/api/ingest/gst

Resposta esperada:

{
  "message": "Ingestao concluida e eventos publicados no RabbitMQ.",
  "count": 2
}
Consultar alertas
curl -i http://localhost:8080/api/alerts

Resposta esperada:

{
  "cache": "MISS",
  "ttlSeconds": 60,
  "alerts": []
}
Cache Redis

O endpoint GET /api/alerts utiliza o padrão Cache-Aside com Redis.

Na primeira chamada, os dados são buscados no serviço e armazenados no cache:

X-Cache: MISS

Na segunda chamada, dentro do período de TTL, os dados são retornados a partir do cache:

X-Cache: HIT
Justificativa do TTL

O TTL do cache Redis foi configurado em 60 segundos para reduzir chamadas repetidas ao endpoint de alertas sem manter informações potencialmente desatualizadas por muito tempo, considerando que dados de clima espacial podem mudar rapidamente.

RabbitMQ

O RabbitMQ é utilizado para comunicação assíncrona entre os microsserviços.

Fluxo:

Ingestion Service -> RabbitMQ -> Alert Service

O ingestion-service atua como producer, publicando eventos na fila:

space.weather.events

O alert-service atua como consumer, consumindo os eventos e aplicando as regras de negócio.

Painel do RabbitMQ:

http://localhost:15672

Credenciais padrão:

usuário: guest
senha: guest

Exemplo de log do producer:

[RabbitMQ] Evento publicado: 2026-05-15T21:00:00-GST-001

Exemplo de log do consumer:

[RabbitMQ] Consumer conectado na fila space.weather.events

Exemplo de idempotência:

[Idempotencia] Evento duplicado descartado: 2026-05-15T21:00:00-GST-001
API Gateway com Nginx

O Nginx atua como API Gateway e proxy reverso, direcionando as requisições para os microsserviços internos.

Rotas principais:

/health
/api/ingest/gst
/api/alerts

O Nginx também possui rate limiting configurado para limitar o excesso de requisições à API.

Durante o smoke test com k6, o rate limiting pode retornar respostas HTTP 503, indicando que o controle de excesso de chamadas está ativo.

Exemplo de log:

limiting requests, excess: 10.930 by zone "api_limit"
Retry com backoff na NASA

A chamada à API da NASA possui mecanismo de retry com backoff, aumentando a resiliência contra falhas temporárias em serviços externos.

Caso ocorra erro na comunicação com a NASA, o sistema realiza novas tentativas com intervalo progressivo antes de retornar falha. Esse comportamento evita que instabilidades momentâneas da API externa interrompam imediatamente o fluxo de ingestão.

Testes unitários

Os testes unitários cobrem as regras de negócio RN1 e RN3.

Rodar testes do Alert Service
cd src/alert-service
npm test

Resultado esperado:

pass

Exemplo de saída:

✔ RN3: evento duplicado deve ser descartado por event_id
✔ RN1: Kp <= 4 deve ser low
✔ RN1: 5 <= Kp <= 7 deve ser moderate
✔ RN1: Kp >= 8 deve ser severe e ativar emergencyNotification
Smoke test com k6

O projeto possui um smoke test configurado com:

10 VUs / 10s

Para executar:

k6 run k6/smoke-test.js

Caso o k6 não esteja instalado localmente, é possível rodar via Docker:

docker run --rm -i --network NOME_DA_REDE_DOCKER grafana/k6 run - < k6/smoke-test.js

Durante o teste, algumas respostas podem retornar HTTP 503 por causa do rate limiting ativo no Nginx. Esse comportamento comprova que a limitação de requisições está funcionando.

Validações realizadas
Health check
curl http://localhost:8080/health

Resultado:

Solar Shield Gateway OK
Ingestão NASA
curl -X POST http://localhost:8080/api/ingest/gst

Resultado:

{
  "message": "Ingestao concluida e eventos publicados no RabbitMQ.",
  "count": 2
}
Cache MISS/HIT

Primeira chamada:

X-Cache: MISS

Segunda chamada:

X-Cache: HIT
RabbitMQ producer/consumer

Producer:

[RabbitMQ] Evento publicado

Consumer:

[RabbitMQ] Consumer conectado na fila space.weather.events

Idempotência:

[Idempotencia] Evento duplicado descartado
Rate limiting Nginx

Durante o teste com k6, o Nginx retornou respostas HTTP 503 e registrou logs de limitação:

limiting requests, excess: 10.930 by zone "api_limit"
Comandos úteis
Ver containers em execução
docker compose ps
Ver logs do Ingestion Service
docker compose logs ingestion-service
Ver logs do Alert Service
docker compose logs alert-service
Ver logs do Nginx
docker compose logs nginx
Parar os containers
docker compose down
Roteiro de avaliação
Clonar o repositório.
Executar:
docker compose up --build
Disparar ingestão:
curl -X POST http://localhost:8080/api/ingest/gst
Consultar alertas:
curl -i http://localhost:8080/api/alerts
Validar cache MISS e HIT.
Rodar testes unitários:
cd src/alert-service
npm test
Rodar smoke test k6:
k6 run k6/smoke-test.js
Verificar RabbitMQ no painel:
http://localhost:15672
Verificar logs de producer, consumer e idempotência:
docker compose logs ingestion-service
docker compose logs alert-service
Verificar rate limiting:
docker compose logs nginx
Integrantes do grupo
Bruno Furlan
Murilo Fernandes
Marcos Paulo