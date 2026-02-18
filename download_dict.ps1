$baseUrl = "https://raw.githubusercontent.com/kujirahand/EJDict/master/src/"
$chars = 97..122 | ForEach-Object { [char]$_ } # a-z

foreach ($char in $chars) {
    $url = "${baseUrl}${char}.txt"
    $output = "dict_${char}.txt"
    Write-Host "Downloading $char..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $output
    } catch {
        Write-Host "Failed to download $char"
    }
}
