# sistema-arquivos

### Pré-requisito
docker instalado

### Como executar:
```
docker compose up --build
```

### Teste de upload do arquivo:
```
curl -F 'file=@teste.txt' http://localhost:8080/upload
```
