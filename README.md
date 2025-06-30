# Sistema de Arquivos Distribuído

Sistema de arquivos distribuído usando **GlusterFS** com balanceamento de carga e alta disponibilidade. O projeto implementa um cluster de 3 nós Node.js com replicação de dados e interface web para upload/download de arquivos.

## 🏗️ Arquitetura

O sistema é composto por:

- **3 Nós Node.js** (`node1`, `node2`, `node3`) - Servidores de aplicação com GlusterFS
- **1 Load Balancer Nginx** - Balanceamento de carga e proxy reverso
- **Frontend Web** - Interface de usuário para gerenciamento de arquivos
- **GlusterFS** - Sistema de arquivos distribuído com replicação

```
┌─────────────────┐    ┌──────────────────────────────────┐
│   Frontend      │────│         Nginx (Load Balancer)    │
│   (Port 8080)   │    │         - Balanceamento          │
└─────────────────┘    │         - Health Check           │
                       │         - File Proxy             │
                       │         - 10.10.10.5             │
                       └──────────────┬───────────────────┘
                                      │
                       ┌──────────────┼───────────────────┐
                       │              │                   │
              ┌────────▼──────┐ ┌─────▼──────┐ ┌─────────▼─────┐
              │    Node 1     │ │   Node 2   │ │    Node 3     │
              │ (10.10.10.2)  │ │(10.10.10.3)│ │ (10.10.10.4)  │
              │ Port: 3000    │ │Port: 3000  │ │ Port: 3000    │
              │ GlusterFS 1   │ │GlusterFS 2 │ │ GlusterFS 3   │
              └───────────────┘ └────────────┘ └───────────────┘
                       │              │                   │
                       └──────────────────────────────────┘
                            GlusterFS rpc network

```

## ⚡ Funcionalidades

### Backend (Node.js + Express)
- ✅ **Upload de arquivos** até 100MB
- ✅ **Listagem de arquivos** com metadados
- ✅ **Download de arquivos** com controle de acesso
- ✅ **Exclusão de arquivos** com validação
- ✅ **Health Check** e status do servidor
- ✅ **CORS** configurado para acesso cross-origin
- ✅ **Tratamento de erros** robusto

### Frontend (HTML5 + Bootstrap + JavaScript)
- ✅ **Interface responsiva** com Bootstrap 5
- ✅ **Upload com barra de progresso** visual
- ✅ **Lista de arquivos** com atualização automática
- ✅ **Status dos servidores** em tempo real
- ✅ **Download direto** de arquivos
- ✅ **Exclusão de arquivos** com confirmação

### Infraestrutura
- ✅ **Alta disponibilidade** - 3 nós com replicação
- ✅ **Balanceamento de carga** - Nginx com health check
- ✅ **Tolerância a falhas** - Failover automático
- ✅ **Rede isolada** - Subnet 10.10.10.0/24
- ✅ **Containers Docker** - Fácil deploy e escalabilidade

## 🚀 Como Executar

### Pré-requisitos
- Docker
- Docker Compose

### 1. Clone e Execute
```bash
# Clone o repositório
git clone <repository-url>
cd sistema-arquivos

# Inicie todos os serviços
docker-compose up -d

# Verifique os logs
docker-compose logs -f
```

### 2. Acesse a Aplicação
- **Interface Web**: http://localhost:8080
- **API Node1**: http://localhost:8080/api/status/node1
- **API Node2**: http://localhost:8080/api/status/node2
- **API Node3**: http://localhost:8080/api/status/node3

### 3. Comandos Úteis
```bash
# Ver status dos containers
docker-compose ps

# Parar todos os serviços
docker-compose down

# Rebuild das imagens
docker-compose up --build

# Ver logs específicos
docker-compose logs nginx
docker-compose logs node1
```

## 📁 Estrutura do Projeto

```
sistema-arquivos/
├── docker-compose.yml          # Orquestração dos containers
├── README.md                   # Esta documentação
├── LICENSE                     # Licença do projeto
├── frontend/                   # Interface web
│   ├── index.html             # Página principal
│   └── script.js              # JavaScript da aplicação
├── nginx/                      # Configuração do load balancer
│   └── nginx.conf             # Configuração do Nginx
└── node-app/                   # Aplicação Node.js
    ├── Dockerfile             # Imagem do container
    ├── entrypoint.sh          # Script de inicialização
    ├── index.js               # Servidor Express
    └── package.json           # Dependências Node.js
```

## 🔧 Configuração Detalhada

### GlusterFS
- **Tipo**: Replica 3 (espelhamento completo)
- **Brick Path**: `/brick` em cada nó
- **Mount Point**: `/mnt/gfs`
- **Volume**: `gv0`

### Nginx Load Balancer
- **Algoritmo**: Round-robin
- **Health Check**: 2 falhas máximas, timeout 30s
- **Proxy Timeout**: 300s para uploads/downloads
- **Client Max Body**: 100MB

### Node.js API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/upload` | Upload de arquivos |
| `GET` | `/files` | Lista arquivos disponíveis |
| `GET` | `/download/:filename` | Download de arquivo específico |
| `DELETE` | `/delete/:filename` | Remove arquivo do sistema |
| `GET` | `/` | Status do servidor |
| `GET` | `/status` | Health check |

### Rede Docker
- **Subnet**: 10.10.10.0/24
- **Nginx**: 10.10.10.5:80
- **Node1**: 10.10.10.2:3000
- **Node2**: 10.10.10.3:3000
- **Node3**: 10.10.10.4:3000

## 🔍 Monitoramento

### Health Checks
O sistema implementa múltiplas camadas de monitoramento:

1. **Nginx Health Check**:
   - Verifica cada nó a cada 10 segundos
   - Remove nós com falhas do balanceamento
   - Reintegra nós após recuperação

2. **Frontend Status**:
   - Interface mostra status em tempo real
   - Atualização automática a cada 10 segundos
   - Indicadores visuais (verde/vermelho)

3. **Logs Centralizados**:
   - Cada operação é logada com timestamp
   - Identificação do servidor responsável
   - Rastreamento de uploads/downloads

## 🛠️ Desenvolvimento

### Estrutura do Código Node.js
```javascript
// Principais módulos utilizados
- express: Framework web
- multer: Upload de arquivos
- fs: Manipulação de arquivos
- path: Manipulação de caminhos
```

### Frontend Technologies
```html
- Bootstrap 5: UI Framework
- Bootstrap Icons: Ícones
- Vanilla JavaScript: Lógica da aplicação
- Fetch API: Comunicação com backend
```

### Configuração do Container
```dockerfile
# Base: Ubuntu 24.04
# Pacotes: glusterfs-server, nodejs, npm
# Porta: 3000
# Entrypoint: Script personalizado
```

## 🔐 Segurança

- **CORS**: Configurado para permitir acesso cross-origin
- **File Validation**: Verificação de tipos e tamanhos
- **Path Sanitization**: Prevenção de path traversal
- **Error Handling**: Tratamento seguro de erros
- **Network Isolation**: Containers em rede privada

## 📈 Performance

### Otimizações Implementadas
- **Proxy Buffering**: Desabilitado para uploads grandes
- **Keep-Alive**: Conexões persistentes
- **Gzip**: Compressão automática de assets
- **Cache Headers**: Cache de 1 ano para assets estáticos
- **Concurrent Uploads**: Suporte a múltiplos uploads simultâneos

### Limites Configurados
- **Upload Size**: 100MB por arquivo
- **Timeout**: 300s para uploads/downloads
- **Connection Timeout**: 75s
- **Memory Usage**: Monitorado via API

## 🚨 Troubleshooting

### Problemas Comuns

1. **Containers não iniciam**:
   ```bash
   # Verificar logs
   docker-compose logs
   
   # Rebuild
   docker-compose up --build
   ```

2. **GlusterFS não monta**:
   ```bash
   # Verificar peers
   docker exec node1 gluster peer status
   
   # Verificar volume
   docker exec node1 gluster volume status
   ```

3. **Upload falha**:
   - Verificar tamanho do arquivo (max 100MB)
   - Verificar espaço em disco
   - Verificar logs do nginx e nodes

4. **Health check falha**:
   ```bash
   # Testar endpoints manualmente
   curl http://localhost:8080/api/status/node1
   curl http://localhost:8080/api/status/node2
   curl http://localhost:8080/api/status/node3
   ```

## 📊 Métricas e Logs

### Logs Importantes
```bash
# Logs do cluster
docker-compose logs -f

# Logs específicos do nginx
docker-compose logs nginx

# Logs de um nó específico
docker-compose logs node1

# Status do GlusterFS
docker exec node1 gluster volume status
docker exec node1 gluster peer status
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🏷️ Tags

`distributed-systems` `glusterfs` `nodejs` `docker` `nginx` `load-balancer` `file-storage` `high-availability` `replica` `microservices`
