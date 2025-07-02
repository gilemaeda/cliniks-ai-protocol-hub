# Script para deploy da função Edge com variáveis de ambiente
param(
    [Parameter(Mandatory=$true)]
    [string]$functionName,
    
    [Parameter(Mandatory=$true)]
    [string]$asaasApiKey
)

# Verifica se o nome da função foi fornecido
if ([string]::IsNullOrEmpty($functionName)) {
    Write-Error "Nome da função não fornecido. Use -functionName para especificar."
    exit 1
}

# Verifica se a chave da API foi fornecida
if ([string]::IsNullOrEmpty($asaasApiKey)) {
    Write-Error "Chave da API Asaas não fornecida. Use -asaasApiKey para especificar."
    exit 1
}

# Executa o comando de deploy com as variáveis de ambiente
Write-Host "Implantando função $functionName com variáveis de ambiente..."
supabase functions deploy $functionName --no-verify-jwt --env-file "./functions/$functionName/.env"

Write-Host "Deploy concluído!"
