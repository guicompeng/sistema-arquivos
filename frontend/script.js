// Configuração da API - nginx faz o proxy para os nodes
const API_BASE_URL = ''; // Usar URL relativa, nginx faz o proxy

// Elementos do DOM
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadText = document.getElementById('uploadText');
const uploadSpinner = document.getElementById('uploadSpinner');
const uploadResult = document.getElementById('uploadResult');
const filesList = document.getElementById('filesList');
const refreshBtn = document.getElementById('refreshBtn');
const refreshIcon = document.getElementById('refreshIcon');
const refreshStatusBtn = document.getElementById('refreshStatusBtn');
const refreshStatusIcon = document.getElementById('refreshStatusIcon');

// Estado da aplicação
let isUploading = false;
let isLoadingFiles = false;
let isLoadingStatus = false;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadFilesList();
    
    // Atualizar lista a cada 30 segundos
    setInterval(loadFilesList, 30000);
    
    // Verificação inicial do status dos nodes (apenas uma vez)
    checkIndividualNodeStatus();
});

// Event Listeners
uploadForm.addEventListener('submit', handleUpload);
refreshBtn.addEventListener('click', loadFilesList);
refreshStatusBtn.addEventListener('click', checkIndividualNodeStatus);

// Função para fazer upload do arquivo
async function handleUpload(event) {
    event.preventDefault();
    
    if (isUploading) return;
    
    const file = fileInput.files[0];
    if (!file) {
        showAlert('Por favor, selecione um arquivo.', 'warning');
        return;
    }
    
    setUploadingState(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showUploadSuccess(result);
            uploadForm.reset();
            loadFilesList(); // Atualizar lista após upload
        } else {
            showAlert(result.error || 'Erro no upload', 'danger');
        }
    } catch (error) {
        console.error('Erro no upload:', error);
        showAlert('Erro de conexão. Verifique se o servidor está rodando.', 'danger');
    } finally {
        setUploadingState(false);
    }
}

// Função para mostrar resultado do upload com sucesso
function showUploadSuccess(result) {
    const alertHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <h6 class="alert-heading">
                <i class="bi bi-check-circle me-2"></i>
                Upload realizado com sucesso!
            </h6>
            <hr>
            <p class="mb-1"><strong>Arquivo:</strong> ${result.originalname}</p>
            <p class="mb-1"><strong>Tamanho:</strong> ${formatFileSize(result.size)}</p>
            <p class="mb-1"><strong>Servidor:</strong> <span class="badge bg-primary">${result.server}</span></p>
            <p class="mb-0"><strong>Data/Hora:</strong> ${formatDateTime(result.uploadTime)}</p>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    uploadResult.innerHTML = alertHTML;
}

// Função para mostrar alertas
function showAlert(message, type = 'info') {
    const alertHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    uploadResult.innerHTML = alertHTML;
}

// Função para controlar estado de upload
function setUploadingState(uploading) {
    isUploading = uploading;
    
    if (uploading) {
        uploadBtn.disabled = true;
        uploadText.innerHTML = '<i class="bi bi-cloud-upload me-2"></i>Enviando...';
        uploadSpinner.classList.remove('d-none');
    } else {
        uploadBtn.disabled = false;
        uploadText.innerHTML = '<i class="bi bi-cloud-upload me-2"></i>Enviar Arquivo';
        uploadSpinner.classList.add('d-none');
    }
}

// Função para carregar lista de arquivos
async function loadFilesList() {
    if (isLoadingFiles) return;
    
    isLoadingFiles = true;
    
    // Mostrar loading no botão
    refreshBtn.disabled = true;
    refreshIcon.classList.add('spin');
    
    // Mostrar loading na lista
    filesList.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary me-2" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
            Carregando lista de arquivos...
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE_URL}/files`);
        const data = await response.json();
        
        if (response.ok) {
            displayFilesList(data);
        } else {
            filesList.innerHTML = `
                <div class="alert alert-warning" role="alert">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Erro ao carregar lista de arquivos: ${data.error || 'Erro desconhecido'}
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar arquivos:', error);
        filesList.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="bi bi-x-circle me-2"></i>
                Erro de conexão ao carregar arquivos.
            </div>
        `;
    } finally {
        isLoadingFiles = false;
        refreshBtn.disabled = false;
        refreshIcon.classList.remove('spin');
    }
}

// Função para exibir lista de arquivos
function displayFilesList(data) {
    if (!data.files || data.files.length === 0) {
        filesList.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-folder2-open display-4 mb-3"></i>
                <p class="mb-0">Nenhum arquivo encontrado</p>
                <small>Faça upload de arquivos para vê-los aqui</small>
            </div>
        `;
        return;
    }
    
    // Agrupar arquivos por nome original
    const groupedFiles = groupFilesByOriginalName(data.files);
    
    const filesHTML = Object.keys(groupedFiles).map(originalName => {
        const versions = groupedFiles[originalName];
        const latestVersion = versions[0]; // Versões já ordenadas por data (mais recente primeiro)
        
        return `
            <div class="border rounded p-3 mb-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">
                            <i class="bi bi-file-earmark me-2"></i>
                            ${originalName}
                            ${versions.length > 1 ? `<span class="badge bg-info ms-2">${versions.length} versões</span>` : ''}
                        </h6>
                        <div class="text-muted small">
                            <div class="row">
                                <div class="col-sm-6">
                                    <i class="bi bi-hdd me-1"></i>
                                    Tamanho: ${formatFileSize(latestVersion.size)}
                                </div>
                                <div class="col-sm-6">
                                    <i class="bi bi-calendar3 me-1"></i>
                                    Última versão
                                </div>
                            </div>
                            ${versions.length > 1 ? `
                                <div class="mt-2">
                                    <small class="text-primary">
                                        <i class="bi bi-clock-history me-1"></i>
                                        ${versions.length - 1} versão(ões) anterior(es) disponível(eis)
                                    </small>
                                </div>
                            ` : ''}
                        </div>
                        ${versions.length > 1 ? `
                            <div class="mt-2">
                                <button class="btn btn-outline-secondary btn-sm" onclick="toggleVersions('${originalName}')" id="toggleBtn-${btoa(originalName)}">
                                    <i class="bi bi-chevron-down me-1"></i>
                                    Mostrar versões
                                </button>
                                <div class="collapse mt-2" id="versions-${btoa(originalName)}">
                                    <div class="border-start border-2 border-secondary ps-3">
                                        ${versions.slice(1).map((version, index) => `
                                            <div class="d-flex justify-content-between align-items-center py-2 ${index < versions.length - 2 ? 'border-bottom' : ''}">
                                                <div>
                                                    <small class="text-muted">
                                                        Versão ${versions.length - index - 1} - ${formatFileSize(version.size)}
                                                    </small>
                                                </div>
                                                <div class="d-flex gap-1">
                                                    <button class="btn btn-outline-primary btn-sm" onclick="downloadFile('${version.filename}')" title="Baixar esta versão">
                                                        <i class="bi bi-download"></i>
                                                    </button>
                                                    <button class="btn btn-outline-danger btn-sm" onclick="deleteFile('${version.filename}')" title="Remover esta versão">
                                                        <i class="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="ms-3 d-flex gap-2">
                        <button class="btn btn-outline-primary btn-sm" onclick="downloadFile('${latestVersion.filename}')" title="Baixar última versão">
                            <i class="bi bi-download"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteFile('${latestVersion.filename}')" title="Remover última versão">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    filesList.innerHTML = `
        <div class="mb-3 text-muted">
            <small>
                <i class="bi bi-info-circle me-1"></i>
                Total: ${data.totalFiles} arquivos | Servidor: <span class="badge bg-secondary">${data.server}</span>
            </small>
        </div>
        ${filesHTML}
    `;
}

// Função para verificar status individual de cada nó
async function checkIndividualNodeStatus() {
    if (isLoadingStatus) return;
    
    isLoadingStatus = true;
    
    // Mostrar loading no botão
    refreshStatusBtn.disabled = true;
    refreshStatusIcon.classList.add('spin');
    
    const nodes = [
        { id: 'node1', name: 'Node 1', endpoint: '/api/status/node1' },
        { id: 'node2', name: 'Node 2', endpoint: '/api/status/node2' }, 
        { id: 'node3', name: 'Node 3', endpoint: '/api/status/node3' }
    ];
    
    // Mostrar estado de loading em todos os nós
    for (const node of nodes) {
        const statusElement = document.getElementById(`status-${node.id}`);
        statusElement.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i>';
        statusElement.className = 'badge bg-secondary me-2';
        statusElement.title = `${node.name} - Verificando...`;
    }
    
    // Verificar cada nó individualmente
    for (const node of nodes) {
        const statusElement = document.getElementById(`status-${node.id}`);
        
        try {
            // Fazer requisição com timeout curto para cada nó
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos timeout
            
            const response = await fetch(node.endpoint, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                // Nó está online
                statusElement.innerHTML = '<i class="bi bi-check-circle"></i>';
                statusElement.className = 'badge bg-success me-2';
                statusElement.title = `${node.name} - Online`;
            } else {
                // Nó retornou erro
                statusElement.innerHTML = '<i class="bi bi-exclamation-triangle"></i>';
                statusElement.className = 'badge bg-warning me-2';
                statusElement.title = `${node.name} - Erro (${response.status})`;
            }
        } catch (error) {
            // Nó está offline ou timeout
            statusElement.innerHTML = '<i class="bi bi-x-circle"></i>';
            statusElement.className = 'badge bg-danger me-2';
            statusElement.title = `${node.name} - Offline`;
        }
    }
    
    // Remover loading do botão
    isLoadingStatus = false;
    refreshStatusBtn.disabled = false;
    refreshStatusIcon.classList.remove('spin');
}

// Funções utilitárias
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Função para extrair nome original do arquivo (remove timestamp)
function getOriginalFileName(filename) {
    return filename.replace(/^\d+-/, '').replace(/_/g, ' ');
}

// Função para agrupar arquivos por nome original
function groupFilesByOriginalName(files) {
    const grouped = {};
    
    files.forEach(file => {
        const originalName = getOriginalFileName(file.filename);
        
        if (!grouped[originalName]) {
            grouped[originalName] = [];
        }
        
        grouped[originalName].push(file);
    });
    
    // Ordenar cada grupo por data de criação (mais recente primeiro)
    Object.keys(grouped).forEach(originalName => {
        grouped[originalName].sort((a, b) => new Date(b.created) - new Date(a.created));
    });
    
    return grouped;
}

// Função para alternar exibição de versões
function toggleVersions(originalName) {
    const encodedName = btoa(originalName);
    const versionsDiv = document.getElementById(`versions-${encodedName}`);
    const toggleBtn = document.getElementById(`toggleBtn-${encodedName}`);
    
    if (versionsDiv.classList.contains('show')) {
        // Ocultar versões
        versionsDiv.classList.remove('show');
        toggleBtn.innerHTML = '<i class="bi bi-chevron-down me-1"></i>Mostrar versões';
    } else {
        // Mostrar versões
        versionsDiv.classList.add('show');
        toggleBtn.innerHTML = '<i class="bi bi-chevron-up me-1"></i>Ocultar versões';
    }
}

// Função para baixar arquivo
async function downloadFile(filename) {
    const downloadBtn = event.target.closest('button');
    const originalContent = downloadBtn.innerHTML;
    
    try {
        // Mostrar loading no botão
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i>';
        
        const response = await fetch(`${API_BASE_URL}/download/${encodeURIComponent(filename)}`, {
            method: 'GET'
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = getOriginalFileName(filename); // Usar função para obter nome original
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showAlert(`Arquivo "${getOriginalFileName(filename)}" baixado com sucesso!`, 'success');
        } else {
            const error = await response.json();
            showAlert(`Erro ao baixar arquivo: ${error.error || 'Erro desconhecido'}`, 'danger');
        }
    } catch (error) {
        console.error('Erro no download:', error);
        showAlert('Erro de conexão ao tentar baixar o arquivo.', 'danger');
    } finally {
        // Restaurar botão
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalContent;
    }
}

// Função para remover arquivo
async function deleteFile(filename) {
    const originalName = getOriginalFileName(filename);
    
    // Confirmar remoção
    if (!confirm(`Tem certeza que deseja remover o arquivo "${originalName}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    const deleteBtn = event.target.closest('button');
    const originalContent = deleteBtn.innerHTML;
    
    try {
        // Mostrar loading no botão
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i>';
        
        const response = await fetch(`${API_BASE_URL}/delete/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert(`Arquivo "${originalName}" removido com sucesso!`, 'success');
            loadFilesList(); // Atualizar lista após remoção
        } else {
            showAlert(`Erro ao remover arquivo: ${result.error || 'Erro desconhecido'}`, 'danger');
        }
    } catch (error) {
        console.error('Erro na remoção:', error);
        showAlert('Erro de conexão ao tentar remover o arquivo.', 'danger');
    } finally {
        // Restaurar botão
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = originalContent;
    }
}
