#!/bin/bash

# Inicia o GlusterFS em foreground (background para seguir o script)
/usr/sbin/glusterd -N &
GLUSTER_PID=$!

# Aguarda o GlusterFS subir
sleep 3

# Define peers e cria volume apenas no node1
if [ "$HOSTNAME" == "node1" ]; then
    echo "Configurando cluster GlusterFS (replica 3)"
    gluster peer probe node2
    gluster peer probe node3
    sleep 3
    gluster volume create gv0 replica 3 \
        node1:/brick \
        node2:/brick \
        node3:/brick force
    gluster volume start gv0
fi

# Aguarda volume estar disponível
sleep 10

# Cria ponto de montagem local
mkdir -p /mnt/gfs
mount -t glusterfs node1:/gv0 /mnt/gfs

# Inicia o app Node.js
exec node index.js
