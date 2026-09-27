[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$script:BaseUrl = 'https://hmif.if.unram.ac.id/api/v3'
$script:ApiKey = [Environment]::GetEnvironmentVariable('COSPLAY_API_KEY')
$script:BearerToken = [Environment]::GetEnvironmentVariable('COSPLAY_BEARER_TOKEN')
$script:AuditRows = New-Object 'System.Collections.Generic.List[object]'
$script:BaselineItems = @()
$script:NetworkFailed = $false
$script:SafetyFailed = $false
$script:StopReason = $null
$script:RentalCountBefore = $null
$script:RentalCountAfter = $null
$script:Summary = [ordered]@{
    'API reachable' = 'NOT TESTED'
    'Authentication' = 'NOT TESTED'
    'Valid rental' = 'NOT TESTED'
    'Valid rental HTTP' = 'NOT TESTED'
    'Backend message' = 'NOT TESTED'
    'Payload field names' = 'NOT TESTED'
    'quantity=0 validation' = 'NOT TESTED'
    'negative quantity validation' = 'NOT TESTED'
    'quantity > stock validation' = 'NOT TESTED'
    'unavailable item validation' = 'NOT TESTED'
    'nonexistent item validation' = 'NOT TESTED'
    'invalid status validation' = 'NOT TESTED'
    'invalid transition validation' = 'NOT VERIFIABLE'
    'database unchanged' = 'NOT VERIFIED'
    'Server-side quantity <= stock validation' = 'UNKNOWN'
}

function Add-AuditRow {
    param(
        [Parameter(Mandatory)][string]$Test,
        [Parameter(Mandatory)][string]$Http,
        [Parameter(Mandatory)][string]$Result,
        [Parameter(Mandatory)][string]$Verdict
    )

    $script:AuditRows.Add([pscustomobject]@{
        Test = $Test
        HTTP = $Http
        Result = $Result
        Verdict = $Verdict
    })
}

function Get-AuditHttpLabel {
    param([object]$Response)

    if ($null -eq $Response) { return 'NO RESPONSE' }
    if ($null -ne $Response.Status) { return [string]$Response.Status }
    if (-not [string]::IsNullOrWhiteSpace([string]$Response.LocalError)) { return 'LOCAL ERROR' }
    return 'NO HTTP STATUS'
}

function Test-Property {
    param([object]$InputObject, [string]$Name)

    if ($null -ne $InputObject -and $InputObject -is [System.Collections.IDictionary]) {
        return $InputObject.Contains($Name)
    }

    return $null -ne $InputObject -and $null -ne $InputObject.PSObject.Properties[$Name]
}

function Get-PropertyValue {
    param([object]$InputObject, [string]$Name)

    if (Test-Property -InputObject $InputObject -Name $Name) {
        if ($InputObject -is [System.Collections.IDictionary]) {
            $value = $InputObject[$Name]
        }
        else {
            $value = $InputObject.PSObject.Properties[$Name].Value
        }
        if ($value -is [array]) {
            return ,$value
        }
        return $value
    }

    return $null
}

function Protect-Text {
    param([AllowNull()][string]$Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return ''
    }

    $safeText = $Text
    foreach ($secret in @($script:ApiKey, $script:BearerToken)) {
        if (-not [string]::IsNullOrEmpty($secret)) {
            $safeText = $safeText.Replace($secret, '[REDACTED]')
        }
    }

    $safeText = [regex]::Replace($safeText, '(?i)(Authorization\s*[:=]\s*)(?:Bearer\s+)?[^\s,;"'']+', '$1[REDACTED]')
    $safeText = [regex]::Replace($safeText, '(?i)((?:X-API-Key|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|secret|password|cookie)\s*[:=]\s*)[^\s,;"'']+', '$1[REDACTED]')
    $safeText = [regex]::Replace($safeText, '(?i)Bearer\s+[^\s,;"'']+', 'Bearer [REDACTED]')
    $safeText = [regex]::Replace($safeText, '(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b', '[REDACTED EMAIL]')
    $safeText = [regex]::Replace($safeText, '(?i)\b(user|rental)_?id\s*[:=]\s*[^\s,;"}]+', '$1_id=[REDACTED]')
    $safeText = [regex]::Replace($safeText, '\s+', ' ').Trim()
    if ($safeText.Length -gt 180) {
        $safeText = $safeText.Substring(0, 180) + '...'
    }

    return $safeText
}

function ConvertTo-SafeAuditValue {
    param([AllowNull()][object]$Value, [int]$Depth = 0)

    if ($null -eq $Value) { return $null }
    if ($Value -is [string]) { return (Protect-Text -Text $Value) }
    if ($Value -is [bool] -or $Value -is [ValueType]) { return $Value }
    if ($Depth -ge 5) { return '[TRUNCATED]' }

    if ($Value -is [array]) {
        $safeItems = @()
        $limit = [Math]::Min($Value.Count, 5)
        for ($index = 0; $index -lt $limit; $index++) {
            $safeItems += ,(ConvertTo-SafeAuditValue -Value $Value[$index] -Depth ($Depth + 1))
        }
        if ($Value.Count -gt $limit) { $safeItems += '[MORE VALUES OMITTED]' }
        return ,$safeItems
    }

    $safeObject = [ordered]@{}
    if ($Value -is [System.Collections.IDictionary]) {
        foreach ($key in $Value.Keys) {
            $name = [string]$key
            if ($name -match '(?i)(^id$|_id$|email|name|title|description|category|image|url|slug|authorization|cookie|api.?key|token|secret|password|credential|stack|trace)') {
                $safeObject[$name] = '[REDACTED]'
            }
            else {
                $safeObject[$name] = ConvertTo-SafeAuditValue -Value $Value[$key] -Depth ($Depth + 1)
            }
        }
        return $safeObject
    }

    foreach ($property in $Value.PSObject.Properties) {
        if ($property.MemberType -notin @('NoteProperty', 'Property', 'AliasProperty')) { continue }
        $name = [string]$property.Name
        if ($name -match '(?i)(^id$|_id$|email|name|title|description|category|image|url|slug|authorization|cookie|api.?key|token|secret|password|credential|stack|trace)') {
            $safeObject[$name] = '[REDACTED]'
        }
        else {
            $safeObject[$name] = ConvertTo-SafeAuditValue -Value $property.Value -Depth ($Depth + 1)
        }
    }
    return $safeObject
}

function Read-HttpErrorBody {
    param([object]$Response)

    if ($null -eq $Response) {
        return ''
    }

    try {
        $stream = $Response.GetResponseStream()
        if ($null -ne $stream) {
            $reader = New-Object System.IO.StreamReader($stream)
            try {
                return $reader.ReadToEnd()
            }
            finally {
                $reader.Dispose()
            }
        }
    }
    catch {
        # PowerShell 7 exposes an HttpResponseMessage instead of a WebResponse.
    }

    try {
        return $Response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    }
    catch {
        return ''
    }
}

function Get-ErrorDetailsBody {
    param([object]$ErrorRecord)

    try {
        if ($null -ne $ErrorRecord.ErrorDetails -and -not [string]::IsNullOrWhiteSpace([string]$ErrorRecord.ErrorDetails.Message)) {
            return [string]$ErrorRecord.ErrorDetails.Message
        }
    }
    catch {
        return ''
    }
    return ''
}

function Convert-ResponseBody {
    param([AllowNull()][string]$Content)

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return $null
    }

    try {
        $parsed = ConvertFrom-Json -InputObject $Content -ErrorAction Stop
        if ($Content.TrimStart().StartsWith('[')) {
            if ($parsed -is [array]) {
                return ,$parsed
            }
            return ,@($parsed)
        }
        if ($parsed -is [array]) {
            return ,$parsed
        }
        return $parsed
    }
    catch {
        return $null
    }
}

function Test-NetworkFailure {
    param([object]$ErrorRecord)

    $exception = $ErrorRecord.Exception
    $networkExceptionTypes = @(
        'System.Net.WebException',
        'System.Net.Http.HttpRequestException',
        'System.Net.Sockets.SocketException',
        'System.Threading.Tasks.TaskCanceledException',
        'System.TimeoutException',
        'System.Security.Authentication.AuthenticationException'
    )
    while ($null -ne $exception) {
        if ($exception.GetType().FullName -in $networkExceptionTypes) {
            return $true
        }
        $exception = $exception.InnerException
    }
    return $false
}

function Get-HttpStatusFromException {
    param([object]$ErrorRecord)

    $exception = $ErrorRecord.Exception
    while ($null -ne $exception) {
        $statusProperty = $exception.PSObject.Properties['StatusCode']
        if ($null -ne $statusProperty -and $null -ne $statusProperty.Value) {
            try { return [int]$statusProperty.Value } catch { return $null }
        }
        $exception = $exception.InnerException
    }
    return $null
}

function Get-SafeLocalError {
    param([object]$ErrorRecord)

    $exception = $ErrorRecord.Exception
    if ($null -eq $exception) {
        return 'Local error (details unavailable).'
    }
    $typeName = $exception.GetType().Name
    $message = Protect-Text -Text ([string]$exception.Message)
    if ([string]::IsNullOrWhiteSpace($message)) {
        return ('Local error (' + $typeName + ').')
    }
    return ('Local error (' + $typeName + '): ' + $message)
}

function Invoke-AuditApi {
    param(
        [Parameter(Mandatory)][ValidateSet('GET', 'POST', 'PUT')][string]$Method,
        [Parameter(Mandatory)][string]$Path,
        [AllowNull()][object]$Body = $null,
        [switch]$WithoutAuthorization
    )

    try {
        if ([string]::IsNullOrWhiteSpace($script:ApiKey)) {
            return [pscustomobject]@{ Status = $null; Body = $null; Content = ''; NetworkError = $false; LocalError = 'API key configuration is missing.' }
        }

        $headers = @{
            Accept = 'application/json'
            'X-API-Key' = $script:ApiKey
        }

        if (-not $WithoutAuthorization) {
            if ([string]::IsNullOrWhiteSpace($script:BearerToken)) {
                return [pscustomobject]@{ Status = $null; Body = $null; Content = ''; NetworkError = $false; LocalError = 'Bearer credential configuration is missing.' }
            }
            $headers['Authorization'] = 'Bearer ' + $script:BearerToken
        }

        $wireMethod = $Method
        $requestPath = $Path

        if ($Method -eq 'PUT') {
            # Match lib/api.js: encode PUT as POST plus method-override headers/query.
            $wireMethod = 'POST'
            $headers['X-HTTP-Method-Override'] = 'PUT'
            $requestPath += $(if ($requestPath.Contains('?')) { '&' } else { '?' }) + '_method=PUT'
        }

        if ($Method -in @('POST', 'PUT')) {
            $headers['X-Dry-Run'] = 'true'
            if ($headers['X-Dry-Run'] -cne 'true') {
                return [pscustomobject]@{ Status = $null; Body = $null; Content = ''; NetworkError = $false; SafetyFailure = 'Mutation refused: X-Dry-Run invariant failed.' }
            }
        }

        $request = @{
            Uri = $script:BaseUrl + '/cosplay' + $requestPath
            Method = $wireMethod
            Headers = $headers
            UseBasicParsing = $true
            MaximumRedirection = 0
            TimeoutSec = 30
            ErrorAction = 'Stop'
        }

        if ($Method -in @('POST', 'PUT')) {
            $request.ContentType = 'application/json'
            $request.Body = ConvertTo-Json -InputObject $Body -Depth 10 -Compress
        }

        $status = $null
        $content = ''
        try {
            $response = Invoke-WebRequest @request
            $status = [int]$response.StatusCode
            $content = [string]$response.Content
        }
        catch {
            $requestError = $_
            $httpResponse = $requestError.Exception.Response
            if ($null -eq $httpResponse) {
                $exceptionStatus = Get-HttpStatusFromException -ErrorRecord $requestError
                if ($null -ne $exceptionStatus) {
                    $errorContent = Get-ErrorDetailsBody -ErrorRecord $requestError
                    return [pscustomobject]@{ Status = $exceptionStatus; Body = (Convert-ResponseBody -Content $errorContent); Content = $errorContent; NetworkError = $false; LocalError = $null }
                }
                if (Test-NetworkFailure -ErrorRecord $requestError) {
                    return [pscustomobject]@{ Status = $null; Body = $null; Content = ''; NetworkError = $true; LocalError = $null }
                }
                return [pscustomobject]@{ Status = $null; Body = $null; Content = ''; NetworkError = $false; LocalError = (Get-SafeLocalError -ErrorRecord $requestError) }
            }

            try {
                $status = [int]$httpResponse.StatusCode
            }
            catch {
                $status = Get-HttpStatusFromException -ErrorRecord $requestError
            }

            $content = Read-HttpErrorBody -Response $httpResponse
            if ([string]::IsNullOrWhiteSpace($content)) {
                $content = Get-ErrorDetailsBody -ErrorRecord $requestError
            }
            if ($null -eq $status) {
                return [pscustomobject]@{ Status = $null; Body = $null; Content = (Protect-Text -Text $content); NetworkError = $false; LocalError = 'HTTP exception did not expose a readable status code.' }
            }
        }

        return [pscustomobject]@{
            Status = $status
            Body = Convert-ResponseBody -Content $content
            Content = $content
            NetworkError = $false
            LocalError = $null
            SafetyFailure = $null
        }
    }
    catch {
        if (Test-NetworkFailure -ErrorRecord $_) {
            return [pscustomobject]@{ Status = $null; Body = $null; Content = ''; NetworkError = $true; LocalError = $null }
        }
        return [pscustomobject]@{
            Status = $null
            Body = $null
            Content = ''
            NetworkError = $false
            LocalError = (Get-SafeLocalError -ErrorRecord $_)
        }
    }
}

function Send-AuditRequest {
    param(
        [Parameter(Mandatory)][string]$Test,
        [Parameter(Mandatory)][ValidateSet('GET', 'POST', 'PUT')][string]$Method,
        [Parameter(Mandatory)][string]$Path,
        [AllowNull()][object]$Body = $null,
        [switch]$WithoutAuthorization
    )

    $response = Invoke-AuditApi -Method $Method -Path $Path -Body $Body -WithoutAuthorization:$WithoutAuthorization
    if ($response.SafetyFailure) {
        $script:SafetyFailed = $true
        $script:StopReason = $response.SafetyFailure
        Add-AuditRow -Test $Test -Http '-' -Result $response.SafetyFailure -Verdict 'BLOCKED'
        return $null
    }

    if ($response.NetworkError) {
        $script:NetworkFailed = $true
        Add-AuditRow -Test $Test -Http 'NETWORK ERROR' -Result 'No HTTP response; stopped audit.' -Verdict 'BLOCKED'
        if ($script:Summary['API reachable'] -eq 'NOT TESTED') {
            $script:Summary['API reachable'] = 'NO (network error before HTTP response)'
        }
        else {
            $script:Summary['API reachable'] = 'PARTIAL (network error during audit)'
        }
        $script:StopReason = 'Request failed before receiving an HTTP response; no further requests were sent.'
        return $null
    }

    if ($response.LocalError) {
        return $response
    }

    if ($script:Summary['API reachable'] -eq 'NOT TESTED') {
        $script:Summary['API reachable'] = 'YES (HTTP response received)'
    }

    return $response
}

function Get-ApplicationSuccess {
    param([object]$Body)

    $success = Get-PropertyValue -InputObject $Body -Name 'success'
    if ($success -is [bool]) {
        return $success
    }

    $data = Get-PropertyValue -InputObject $Body -Name 'data'
    $success = Get-PropertyValue -InputObject $data -Name 'success'
    if ($success -is [bool]) {
        return $success
    }

    return $null
}

function Get-ApiMessage {
    param([object]$Body)

    $node = $Body
    for ($depth = 0; $depth -lt 4 -and $null -ne $node; $depth++) {
        $message = Get-PropertyValue -InputObject $node -Name 'message'
        if ($message -is [string] -and -not [string]::IsNullOrWhiteSpace($message)) {
            return (Protect-Text -Text $message)
        }

        $code = Get-PropertyValue -InputObject $node -Name 'code'
        if ($code -is [string] -and -not [string]::IsNullOrWhiteSpace($code)) {
            return (Protect-Text -Text $code)
        }

        $nestedError = Get-PropertyValue -InputObject $node -Name 'error'
        if ($null -ne $nestedError) {
            if ($nestedError -is [string]) {
                return (Protect-Text -Text $nestedError)
            }
            $node = $nestedError
            continue
        }

        $errors = Get-PropertyValue -InputObject $node -Name 'errors'
        if ($null -ne $errors) {
            $safeErrors = ConvertTo-SafeAuditValue -Value $errors
            return (Protect-Text -Text (ConvertTo-Json -InputObject $safeErrors -Depth 6 -Compress))
        }

        $data = Get-PropertyValue -InputObject $node -Name 'data'
        if ($null -ne $data) {
            $node = $data
            continue
        }

        break
    }

    return ''
}

function Get-BackendMessageText {
    param([object]$Response)

    if ($null -eq $Response) { return '' }
    $message = Get-ApiMessage -Body $Response.Body
    if (-not [string]::IsNullOrWhiteSpace($message)) { return $message }
    if (-not [string]::IsNullOrWhiteSpace([string]$Response.Content)) {
        return (Protect-Text -Text ([string]$Response.Content))
    }
    return ''
}

function Get-ResponseShape {
    param([object]$Body)

    if ($null -eq $Body) {
        return 'empty/non-JSON response'
    }
    if ($Body -is [array]) {
        return 'array response'
    }

    $knownKeys = @('success', 'data', 'message', 'rental', 'calculation', 'error', 'errors')
    $presentKeys = @($knownKeys | Where-Object { Test-Property -InputObject $Body -Name $_ })
    if ($presentKeys.Count -gt 0) {
        return 'object keys: ' + ($presentKeys -join ',')
    }

    return 'object response'
}

function Get-ResponseSummary {
    param([object]$Response)

    if ($null -eq $Response) { return 'No response object.' }
    if (-not [string]::IsNullOrWhiteSpace([string]$Response.LocalError)) {
        return (Protect-Text -Text $Response.LocalError)
    }

    $backendText = ''
    if ($null -ne $Response.Body) {
        $safeFields = [ordered]@{}
        $nodes = @($Response.Body)
        $nestedData = Get-PropertyValue -InputObject $Response.Body -Name 'data'
        if ($null -ne $nestedData) { $nodes += $nestedData }
        foreach ($node in $nodes) {
            foreach ($field in @('success', 'message', 'error', 'errors')) {
                if (-not $safeFields.Contains($field) -and (Test-Property -InputObject $node -Name $field)) {
                    $safeFields[$field] = ConvertTo-SafeAuditValue -Value (Get-PropertyValue -InputObject $node -Name $field)
                }
            }
        }

        if ($safeFields.Count -gt 0) {
            $backendText = ConvertTo-Json -InputObject $safeFields -Depth 6 -Compress
        }
        elseif (Test-ApiCollection -Body $Response.Body -CollectionNames @('items', 'rentals')) {
            $backendText = 'JSON ' + (Get-ResponseShape -Body $Response.Body) + '; record values omitted from summary.'
        }
        else {
            $safeBody = ConvertTo-SafeAuditValue -Value $Response.Body
            $backendText = 'JSON ' + (Get-ResponseShape -Body $Response.Body) + ': ' + (ConvertTo-Json -InputObject $safeBody -Depth 6 -Compress)
        }
    }
    elseif (-not [string]::IsNullOrWhiteSpace([string]$Response.Content)) {
        $backendText = Protect-Text -Text ([string]$Response.Content)
    }

    if ([string]::IsNullOrWhiteSpace($backendText)) {
        $backendText = 'No backend message provided.'
    }

    $classification = 'HTTP response received'
    $applicationSuccess = Get-ApplicationSuccess -Body $Response.Body
    if ($Response.Status -ge 200 -and $Response.Status -lt 300 -and $applicationSuccess -ne $false) {
        $classification = 'accepted (dry-run; not evidence of persistence)'
    }
    elseif ($Response.Status -ge 400) {
        $classification = 'backend returned an error'
    }

    return (Protect-Text -Text ('backend: ' + $backendText + '; ' + $classification))
}

function Get-ApiCollection {
    param([object]$Body, [string[]]$CollectionNames)

    $node = $Body
    for ($depth = 0; $depth -lt 4 -and $null -ne $node; $depth++) {
        if ($node -is [array]) {
            return @($node)
        }

        foreach ($name in $CollectionNames) {
            $candidate = Get-PropertyValue -InputObject $node -Name $name
            if ($candidate -is [array]) {
                return @($candidate)
            }
        }

        $data = Get-PropertyValue -InputObject $node -Name 'data'
        if ($null -ne $data) {
            $node = $data
            continue
        }

        break
    }

    return @()
}

function Test-ApiCollection {
    param([object]$Body, [string[]]$CollectionNames)

    $node = $Body
    for ($depth = 0; $depth -lt 4 -and $null -ne $node; $depth++) {
        if ($node -is [array]) { return $true }
        foreach ($name in $CollectionNames) {
            $candidate = Get-PropertyValue -InputObject $node -Name $name
            if ($candidate -is [array]) { return $true }
        }
        $node = Get-PropertyValue -InputObject $node -Name 'data'
    }
    return $false
}

function Copy-RentalPayload {
    param([Parameter(Mandatory)][System.Collections.IDictionary]$Payload)

    $copy = [ordered]@{}
    foreach ($key in $Payload.Keys) {
        $copy[$key] = $Payload[$key]
    }
    return ,$copy
}

function Get-ItemObject {
    param([object]$Body)

    $node = Get-PropertyValue -InputObject $Body -Name 'data'
    if ($null -eq $node) {
        $node = $Body
    }
    foreach ($name in @('item', 'data')) {
        $nested = Get-PropertyValue -InputObject $node -Name $name
        if ($null -ne $nested) {
            $node = $nested
        }
    }
    return $node
}

function Get-PositiveId {
    param([object]$Value)

    $parsed = 0L
    if ([long]::TryParse([string]$Value, [ref]$parsed) -and $parsed -gt 0) {
        return $parsed
    }
    return $null
}

function Get-CurrentUserId {
    param([object]$Body)

    $data = Get-PropertyValue -InputObject $Body -Name 'data'
    $userId = Get-PropertyValue -InputObject $data -Name 'user_id'
    if ($null -eq $userId) {
        $user = Get-PropertyValue -InputObject $data -Name 'user'
        $userId = Get-PropertyValue -InputObject $user -Name 'id'
    }
    if ($null -eq $userId) {
        $userId = Get-PropertyValue -InputObject $data -Name 'id'
    }
    if ($null -eq $userId) {
        $userId = Get-PropertyValue -InputObject $Body -Name 'user_id'
    }
    if ($null -eq $userId) {
        $userId = Get-PropertyValue -InputObject $Body -Name 'id'
    }
    if ($null -eq $userId) {
        $user = Get-PropertyValue -InputObject $Body -Name 'user'
        $userId = Get-PropertyValue -InputObject $user -Name 'id'
    }

    if ($null -eq $userId -or $userId -is [array] -or $userId -is [System.Collections.IDictionary]) {
        return $null
    }
    if ([string]::IsNullOrWhiteSpace([string]$userId)) {
        return $null
    }
    return $userId
}

function Get-ValidationVerdict {
    param([object]$Response, [int[]]$ExpectedStatuses)

    if ($null -eq $Response.Status) { return 'UNKNOWN (no HTTP status)' }
    if ($Response.Status -in $ExpectedStatuses) {
        return 'PASS'
    }

    $applicationSuccess = Get-ApplicationSuccess -Body $Response.Body
    if ($Response.Status -ge 200 -and $Response.Status -lt 300) {
        if ($applicationSuccess -eq $false) {
            return 'PASS'
        }
        return 'FAIL (request accepted)'
    }

    return 'UNKNOWN (unexpected HTTP response)'
}

function Get-TransitionValidationVerdict {
    param([object]$Response)

    if ($null -eq $Response.Status) { return 'UNKNOWN (no HTTP status)' }
    $applicationSuccess = Get-ApplicationSuccess -Body $Response.Body
    if ($Response.Status -ge 200 -and $Response.Status -lt 300 -and $applicationSuccess -ne $false) {
        return 'FAIL (invalid transition accepted)'
    }

    $message = (Get-BackendMessageText -Response $Response) + ' ' + (Get-ResponseSummary -Response $Response)
    if ($Response.Status -in @(400, 409, 422) -and $message -match '(?i)transition|transisi|invalid.*status|status.*invalid|status.*not allowed|cannot|not allowed|tidak valid|perubahan status') {
        return 'PASS (transition-specific rejection)'
    }

    if ($Response.Status -ge 400 -and $Response.Status -lt 500) {
        return 'UNKNOWN (rejected, but transition reason not confirmed)'
    }

    return 'UNKNOWN (unexpected HTTP response)'
}

function Invoke-PostValidationTest {
    param(
        [Parameter(Mandatory)][string]$Test,
        [Parameter(Mandatory)][object]$Payload,
        [Parameter(Mandatory)][string]$SummaryKey,
        [Parameter(Mandatory)][int[]]$ExpectedStatuses
    )

    $response = Send-AuditRequest -Test $Test -Method 'POST' -Path '/rentals' -Body $Payload
    if ($null -eq $response) {
        $script:Summary[$SummaryKey] = 'UNKNOWN (network error)'
        return $false
    }

    $verdict = Get-ValidationVerdict -Response $response -ExpectedStatuses $ExpectedStatuses
    Add-AuditRow -Test $Test -Http (Get-AuditHttpLabel -Response $response) -Result (Get-ResponseSummary -Response $response) -Verdict $verdict
    $script:Summary[$SummaryKey] = $verdict
    return $true
}

function Find-ConfirmedMissingItemId {
    param([long]$StartingId)

    for ($attempt = 0; $attempt -lt 10; $attempt++) {
        $candidate = $StartingId + $attempt
        $response = Send-AuditRequest -Test 'Confirm nonexistent item id (GET probe)' -Method 'GET' -Path ('/items/' + $candidate)
        if ($null -eq $response) {
            return $null
        }

        if ($response.Status -eq 404) {
            Add-AuditRow -Test 'Confirm nonexistent item id (GET probe)' -Http (Get-AuditHttpLabel -Response $response) -Result (Get-ResponseSummary -Response $response) -Verdict 'PASS (candidate absent)'
            return $candidate
        }

        if ($response.Status -ge 200 -and $response.Status -lt 300) {
            Add-AuditRow -Test 'Confirm nonexistent item id (GET probe)' -Http (Get-AuditHttpLabel -Response $response) -Result (Get-ResponseSummary -Response $response) -Verdict 'CANDIDATE EXISTS'
            continue
        }

        Add-AuditRow -Test 'Confirm nonexistent item id (GET probe)' -Http (Get-AuditHttpLabel -Response $response) -Result (Get-ResponseSummary -Response $response) -Verdict 'NOT VERIFIABLE'
        return $null
    }

    Add-AuditRow -Test 'Confirm nonexistent item id (GET probe)' -Http '-' -Result 'No absent ID confirmed after 10 read-only probes.' -Verdict 'NOT VERIFIABLE'
    return $null
}

function Invoke-RentalAudit {
    if ([string]::IsNullOrWhiteSpace($script:ApiKey) -or [string]::IsNullOrWhiteSpace($script:BearerToken)) {
        Add-AuditRow -Test 'Credential check' -Http '-' -Result 'Set COSPLAY_API_KEY and COSPLAY_BEARER_TOKEN in this PowerShell session.' -Verdict 'BLOCKED'
        $script:Summary['Authentication'] = 'BLOCKED (required environment variable missing)'
        $script:StopReason = 'Credentials are not configured; no request was sent.'
        return
    }

    $userResponse = Send-AuditRequest -Test 'GET /cosplay/me' -Method 'GET' -Path '/me'
    if ($null -eq $userResponse) { return }
    $userId = $null
    if ($userResponse.Status -ge 200 -and $userResponse.Status -lt 300 -and (Get-ApplicationSuccess -Body $userResponse.Body) -ne $false) {
        $userId = Get-CurrentUserId -Body $userResponse.Body
    }
    if ($null -ne $userId) {
        Add-AuditRow -Test 'GET /cosplay/me' -Http (Get-AuditHttpLabel -Response $userResponse) -Result ((Get-ResponseSummary -Response $userResponse) + '; account id resolved and withheld from output.') -Verdict 'PASS'
        $script:Summary['Authentication'] = 'Bearer accepted for GET /cosplay/me; mutation check pending'
    }
    else {
        Add-AuditRow -Test 'GET /cosplay/me' -Http (Get-AuditHttpLabel -Response $userResponse) -Result ((Get-ResponseSummary -Response $userResponse) + '; no usable user_id was resolved.') -Verdict 'NOT VERIFIABLE'
        $script:Summary['Authentication'] = 'NOT VERIFIED (Bearer account id unavailable)'
    }

    $itemsResponse = Send-AuditRequest -Test 'GET /cosplay/items baseline' -Method 'GET' -Path '/items'
    if ($null -eq $itemsResponse) {
        return
    }
    $items = @()
    $itemsCollectionPresent = Test-ApiCollection -Body $itemsResponse.Body -CollectionNames @('items')
    $itemsReadable = $itemsResponse.Status -ge 200 -and $itemsResponse.Status -lt 300 -and (Get-ApplicationSuccess -Body $itemsResponse.Body) -ne $false -and $itemsCollectionPresent
    if ($itemsReadable) {
        $rawItems = @(Get-ApiCollection -Body $itemsResponse.Body -CollectionNames @('items'))
        foreach ($record in $rawItems) {
            $id = Get-PositiveId -Value (Get-PropertyValue -InputObject $record -Name 'id')
            $stockValue = 0L
            $stockRaw = Get-PropertyValue -InputObject $record -Name 'stock'
            $status = [string](Get-PropertyValue -InputObject $record -Name 'status')
            if ($null -eq $id -or -not [long]::TryParse([string]$stockRaw, [ref]$stockValue) -or $stockValue -lt 0) {
                continue
            }
            if ($status -notin @('available', 'unavailable')) {
                continue
            }
            $items += [pscustomobject]@{ id = $id; stock = $stockValue; status = $status }
        }

        $script:BaselineItems = @($items | ForEach-Object { [pscustomobject]@{ id = $_.id; stock = $_.stock; status = $_.status } })
        Add-AuditRow -Test 'GET /cosplay/items baseline' -Http (Get-AuditHttpLabel -Response $itemsResponse) -Result ((Get-ResponseSummary -Response $itemsResponse) + '; read ' + $items.Count + ' item record(s); displayed fields are id, stock, status.') -Verdict 'PASS'
    }
    else {
        Add-AuditRow -Test 'GET /cosplay/items baseline' -Http (Get-AuditHttpLabel -Response $itemsResponse) -Result (Get-ResponseSummary -Response $itemsResponse) -Verdict 'UNKNOWN (item baseline unavailable)'
    }

    $availableItems = @($items | Where-Object { $_.status -eq 'available' -and $_.stock -gt 0 } | Sort-Object stock, id)
    $unavailableItems = @($items | Where-Object { $_.status -eq 'unavailable' })
    if ($availableItems.Count -eq 0) {
        $script:Summary['Valid rental'] = 'NOT VERIFIABLE (no available item with positive stock)'
        $script:Summary['quantity > stock validation'] = 'UNKNOWN'
        $script:Summary['Server-side quantity <= stock validation'] = 'UNKNOWN'
        $script:Summary['quantity=0 validation'] = 'NOT VERIFIABLE (no usable rental payload)'
        $script:Summary['negative quantity validation'] = 'NOT VERIFIABLE (no usable rental payload)'
        $script:Summary['nonexistent item validation'] = 'NOT VERIFIABLE (no usable rental payload)'
        $script:Summary['invalid status validation'] = 'NOT VERIFIABLE (no usable rental payload)'
    }
    $availableItem = if ($availableItems.Count -gt 0) { $availableItems[0] } else { $null }
    $unavailableStatusIsolated = $false
    if ($unavailableItems.Count -gt 0) {
        $unavailableWithStock = @($unavailableItems | Where-Object { $_.stock -gt 0 })
        if ($unavailableWithStock.Count -gt 0) {
            $unavailableItem = $unavailableWithStock[0]
            $unavailableStatusIsolated = $true
        }
        else {
            $unavailableItem = $unavailableItems[0]
        }
    }
    else {
        $unavailableItem = $null
        $script:Summary['unavailable item validation'] = 'NOT VERIFIABLE (no unavailable item in baseline)'
    }

    $rentalsResponse = Send-AuditRequest -Test 'GET existing rentals for invalid-transition candidates' -Method 'GET' -Path '/rentals'
    if ($null -eq $rentalsResponse) {
        return
    }

    $existingRentals = @()
    $rentalsCollectionPresent = Test-ApiCollection -Body $rentalsResponse.Body -CollectionNames @('rentals', 'data')
    $rentalsReadable = $rentalsResponse.Status -ge 200 -and $rentalsResponse.Status -lt 300 -and (Get-ApplicationSuccess -Body $rentalsResponse.Body) -ne $false -and $rentalsCollectionPresent
    if ($rentalsReadable) {
        $rawRentals = @(Get-ApiCollection -Body $rentalsResponse.Body -CollectionNames @('rentals', 'data'))
        $script:RentalCountBefore = $rawRentals.Count
        foreach ($rental in $rawRentals) {
            $rentalId = Get-PositiveId -Value (Get-PropertyValue -InputObject $rental -Name 'id')
            $rentalStatus = ([string](Get-PropertyValue -InputObject $rental -Name 'status')).ToLowerInvariant()
            if ($null -ne $rentalId -and $rentalStatus -in @('pending', 'returned', 'cancelled')) {
                $existingRentals += [pscustomobject]@{ id = $rentalId; status = $rentalStatus }
            }
        }
        Add-AuditRow -Test 'GET existing rentals for invalid-transition candidates' -Http (Get-AuditHttpLabel -Response $rentalsResponse) -Result ((Get-ResponseSummary -Response $rentalsResponse) + '; ' + $existingRentals.Count + ' transition candidate(s).') -Verdict 'PASS'
    }
    else {
        Add-AuditRow -Test 'GET existing rentals for invalid-transition candidates' -Http (Get-AuditHttpLabel -Response $rentalsResponse) -Result (Get-ResponseSummary -Response $rentalsResponse) -Verdict 'NOT VERIFIABLE'
        $script:Summary['invalid transition validation'] = 'NOT VERIFIABLE (rental list unavailable)'
    }

    $validPayload = $null
    if ($null -ne $userId -and $null -ne $availableItem) {
        $startDate = (Get-Date).Date.AddDays(2).ToString('yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture)
        $endDate = (Get-Date).Date.AddDays(3).ToString('yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture)
        $validPayload = [ordered]@{
            user_id = $userId
            item_id = $availableItem.id
            start_date = $startDate
            end_date = $endDate
            quantity = 1
        }
        $payloadFields = @($validPayload.Keys) -join ', '
        $script:Summary['Payload field names'] = $payloadFields

        $validResponse = Send-AuditRequest -Test 'Valid rental (dry-run)' -Method 'POST' -Path '/rentals' -Body $validPayload
        if ($null -eq $validResponse) { return }
        $validSuccess = $validResponse.Status -ge 200 -and $validResponse.Status -lt 300 -and (Get-ApplicationSuccess -Body $validResponse.Body) -ne $false
        if ($validSuccess) {
            $validVerdict = 'PASS'
        }
        elseif ($validResponse.Status -ge 400 -and $validResponse.Status -lt 500) {
            $validVerdict = 'FAIL (valid request rejected)'
        }
        else {
            $validVerdict = 'UNKNOWN (server/local response did not validate the payload)'
        }

        $validMessage = Get-BackendMessageText -Response $validResponse
        if ([string]::IsNullOrWhiteSpace($validMessage)) {
            $validMessage = Get-ResponseSummary -Response $validResponse
        }
        $script:Summary['Valid rental'] = $validVerdict
        $script:Summary['Valid rental HTTP'] = if ($null -eq $validResponse.Status) { 'no HTTP response' } else { [string]$validResponse.Status }
        $script:Summary['Backend message'] = Protect-Text -Text $validMessage
        Add-AuditRow -Test 'Valid rental (dry-run)' -Http (Get-AuditHttpLabel -Response $validResponse) -Result ((Get-ResponseSummary -Response $validResponse) + '; payload fields: ' + $payloadFields) -Verdict $validVerdict

        $zeroPayload = Copy-RentalPayload -Payload $validPayload
        $zeroPayload.quantity = 0
        if (-not (Invoke-PostValidationTest -Test 'quantity = 0' -Payload $zeroPayload -SummaryKey 'quantity=0 validation' -ExpectedStatuses @(400, 422))) { return }

        $negativePayload = Copy-RentalPayload -Payload $validPayload
        $negativePayload.quantity = -1
        if (-not (Invoke-PostValidationTest -Test 'quantity = -1' -Payload $negativePayload -SummaryKey 'negative quantity validation' -ExpectedStatuses @(400, 422))) { return }

        $overStockPayload = Copy-RentalPayload -Payload $validPayload
        if ($availableItem.stock -ge [long]::MaxValue) {
            Add-AuditRow -Test 'quantity > stock' -Http '-' -Result 'Cannot safely represent stock + 1 for selected item.' -Verdict 'NOT VERIFIABLE'
            $script:Summary['quantity > stock validation'] = 'UNKNOWN'
        }
        else {
            $overStockPayload.quantity = [long]$availableItem.stock + 1
            $overStockResponse = Send-AuditRequest -Test 'quantity > stock' -Method 'POST' -Path '/rentals' -Body $overStockPayload
            if ($null -eq $overStockResponse) { return }

            $overStockAccepted = $overStockResponse.Status -ge 200 -and $overStockResponse.Status -lt 300 -and (Get-ApplicationSuccess -Body $overStockResponse.Body) -ne $false
            $overStockMessage = (Get-BackendMessageText -Response $overStockResponse) + ' ' + (Get-ResponseSummary -Response $overStockResponse)
            $stockSpecificRejection = $overStockMessage -match '(?i)(insufficient|not enough|out of).{0,50}(stock|stok|quantity|jumlah)|(stock|stok|quantity|jumlah).{0,50}(insufficient|not enough|exceed|tidak cukup|melebihi|tersedia)|stok tidak cukup|out of stock'
            if ($overStockAccepted) {
                $overStockVerdict = 'FAIL (request accepted)'
                $script:Summary['quantity > stock validation'] = 'NOT VERIFIED'
                $script:Summary['Server-side quantity <= stock validation'] = 'NOT VERIFIED'
            }
            elseif (($overStockResponse.Status -in @(400, 409, 422) -or ($overStockResponse.Status -ge 200 -and $overStockResponse.Status -lt 300 -and (Get-ApplicationSuccess -Body $overStockResponse.Body) -eq $false)) -and $stockSpecificRejection) {
                $overStockVerdict = 'PASS (rejected for insufficient stock/quantity)'
                $script:Summary['quantity > stock validation'] = 'PASS'
                $script:Summary['Server-side quantity <= stock validation'] = 'VERIFIED'
            }
            elseif ($overStockResponse.Status -ge 400 -and $overStockResponse.Status -lt 500) {
                $overStockVerdict = 'UNKNOWN (rejected, reason not stock-specific)'
                $script:Summary['quantity > stock validation'] = 'UNKNOWN'
                $script:Summary['Server-side quantity <= stock validation'] = 'UNKNOWN'
            }
            else {
                $overStockVerdict = 'UNKNOWN'
                $script:Summary['quantity > stock validation'] = 'UNKNOWN'
                $script:Summary['Server-side quantity <= stock validation'] = 'UNKNOWN'
            }
            Add-AuditRow -Test 'quantity > stock' -Http (Get-AuditHttpLabel -Response $overStockResponse) -Result (Get-ResponseSummary -Response $overStockResponse) -Verdict $overStockVerdict
        }

        if ($null -ne $unavailableItem) {
            $unavailablePayload = Copy-RentalPayload -Payload $validPayload
            $unavailablePayload.item_id = $unavailableItem.id
            $unavailablePayload.quantity = 1
            $response = Send-AuditRequest -Test 'Item unavailable' -Method 'POST' -Path '/rentals' -Body $unavailablePayload
            if ($null -eq $response) { return }
            $verdict = Get-ValidationVerdict -Response $response -ExpectedStatuses @(400, 403, 404, 409, 422)
            if ($verdict -eq 'PASS' -and -not $unavailableStatusIsolated) {
                $verdict = 'UNKNOWN (stock=0 also explains rejection)'
            }
            Add-AuditRow -Test 'Item unavailable' -Http (Get-AuditHttpLabel -Response $response) -Result (Get-ResponseSummary -Response $response) -Verdict $verdict
            $script:Summary['unavailable item validation'] = $verdict
        }
        else {
            $script:Summary['unavailable item validation'] = 'NOT VERIFIABLE (no unavailable item in baseline)'
        }

        $missingItemId = $null
        if ($items.Count -gt 0) {
            $maxItemId = [long](($items | Measure-Object -Property id -Maximum).Maximum)
            if ($maxItemId -lt ([long]::MaxValue - 10)) {
                $missingItemId = Find-ConfirmedMissingItemId -StartingId ($maxItemId + 1)
                if ($script:NetworkFailed -or $script:SafetyFailed) { return }
            }
            else {
                Add-AuditRow -Test 'Confirm nonexistent item id (GET probe)' -Http '-' -Result 'No safe candidate id could be generated.' -Verdict 'NOT VERIFIABLE'
            }
        }

        if ($null -ne $missingItemId) {
            $missingPayload = Copy-RentalPayload -Payload $validPayload
            $missingPayload.item_id = $missingItemId
            $response = Send-AuditRequest -Test 'Nonexistent item_id' -Method 'POST' -Path '/rentals' -Body $missingPayload
            if ($null -eq $response) { return }
            $verdict = Get-ValidationVerdict -Response $response -ExpectedStatuses @(400, 404, 422)
            Add-AuditRow -Test 'Nonexistent item_id' -Http (Get-AuditHttpLabel -Response $response) -Result (Get-ResponseSummary -Response $response) -Verdict $verdict
            $script:Summary['nonexistent item validation'] = $verdict
        }
        else {
            $script:Summary['nonexistent item validation'] = 'NOT VERIFIABLE (no missing ID confirmed)'
        }

        $invalidStatusPayload = Copy-RentalPayload -Payload $validPayload
        $invalidStatusPayload.status = 'invalid_status'
        if (-not (Invoke-PostValidationTest -Test 'Invalid rental status' -Payload $invalidStatusPayload -SummaryKey 'invalid status validation' -ExpectedStatuses @(400, 422))) { return }
    }
    else {
        $missingPrerequisite = if ($null -eq $userId) { 'GET /me did not provide user_id' } else { 'no available item with stock > 0' }
        foreach ($testName in @('Valid rental (dry-run)', 'quantity = 0', 'quantity = -1', 'quantity > stock', 'Nonexistent item_id', 'Invalid rental status')) {
            Add-AuditRow -Test $testName -Http '-' -Result ('NOT RUN: ' + $missingPrerequisite + '.') -Verdict 'NOT VERIFIABLE'
        }
        $script:Summary['Valid rental'] = 'NOT VERIFIABLE (' + $missingPrerequisite + ')'
        $script:Summary['Valid rental HTTP'] = 'NOT TESTED'
        $script:Summary['Backend message'] = 'No rental request sent because its required data was unavailable.'
        $script:Summary['Payload field names'] = 'NOT BUILT'
        $script:Summary['quantity=0 validation'] = 'NOT VERIFIABLE (' + $missingPrerequisite + ')'
        $script:Summary['negative quantity validation'] = 'NOT VERIFIABLE (' + $missingPrerequisite + ')'
        $script:Summary['quantity > stock validation'] = 'UNKNOWN (' + $missingPrerequisite + ')'
        $script:Summary['Server-side quantity <= stock validation'] = 'UNKNOWN'
        $script:Summary['nonexistent item validation'] = 'NOT VERIFIABLE (' + $missingPrerequisite + ')'
        $script:Summary['invalid status validation'] = 'NOT VERIFIABLE (' + $missingPrerequisite + ')'
        if ($null -ne $userId -and $null -ne $unavailableItem) {
            $unavailableOnlyPayload = [ordered]@{
                user_id = $userId
                item_id = $unavailableItem.id
                start_date = (Get-Date).Date.AddDays(2).ToString('yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture)
                end_date = (Get-Date).Date.AddDays(3).ToString('yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture)
                quantity = 1
            }
            $unavailableOnlyResponse = Send-AuditRequest -Test 'Item unavailable' -Method 'POST' -Path '/rentals' -Body $unavailableOnlyPayload
            if ($null -eq $unavailableOnlyResponse) { return }
            $unavailableOnlyVerdict = Get-ValidationVerdict -Response $unavailableOnlyResponse -ExpectedStatuses @(400, 403, 404, 409, 422)
            if ($unavailableOnlyVerdict -eq 'PASS' -and $unavailableItem.stock -eq 0) {
                $unavailableOnlyVerdict = 'UNKNOWN (stock=0 also explains rejection)'
            }
            Add-AuditRow -Test 'Item unavailable' -Http (Get-AuditHttpLabel -Response $unavailableOnlyResponse) -Result (Get-ResponseSummary -Response $unavailableOnlyResponse) -Verdict $unavailableOnlyVerdict
            $script:Summary['unavailable item validation'] = $unavailableOnlyVerdict
        }
        else {
            $unavailableSkipReason = if ($null -eq $userId) { 'GET /me did not provide user_id' } else { 'no unavailable item in baseline' }
            Add-AuditRow -Test 'Item unavailable' -Http '-' -Result ('NOT RUN: ' + $unavailableSkipReason + '.') -Verdict 'NOT VERIFIABLE'
            $script:Summary['unavailable item validation'] = 'NOT VERIFIABLE (' + $unavailableSkipReason + ')'
        }
    }

    if ($rentalsReadable) {
        $transitionCases = @(
            [pscustomobject]@{ From = 'pending'; To = 'returned' }
            [pscustomobject]@{ From = 'returned'; To = 'approved' }
            [pscustomobject]@{ From = 'cancelled'; To = 'ongoing' }
        )
        $transitionResults = @()
        foreach ($transition in $transitionCases) {
            $candidate = $existingRentals | Where-Object { $_.status -eq $transition.From } | Select-Object -First 1
            if ($null -eq $candidate) {
                continue
            }

            $transitionBody = @{ status = $transition.To }
            $transitionResponse = Send-AuditRequest -Test ('Invalid transition ' + $transition.From + ' -> ' + $transition.To) -Method 'PUT' -Path ('/rentals/' + $candidate.id) -Body $transitionBody
            if ($null -eq $transitionResponse) { return }
            $transitionVerdict = Get-TransitionValidationVerdict -Response $transitionResponse
            Add-AuditRow -Test ('Invalid transition ' + $transition.From + ' -> ' + $transition.To) -Http (Get-AuditHttpLabel -Response $transitionResponse) -Result (Get-ResponseSummary -Response $transitionResponse) -Verdict $transitionVerdict
            $transitionResults += $transitionVerdict
        }

        if ($transitionResults.Count -eq 0) {
            Add-AuditRow -Test 'Invalid rental status transition' -Http '-' -Result 'No existing rental matched pending, returned, or cancelled.' -Verdict 'NOT VERIFIABLE'
            $script:Summary['invalid transition validation'] = 'NOT VERIFIABLE (no matching rental state)'
        }
        elseif (@($transitionResults | Where-Object { $_ -ne 'PASS' }).Count -eq 0) {
            $script:Summary['invalid transition validation'] = 'PASS (all tested transitions rejected)'
        }
        elseif (@($transitionResults | Where-Object { $_ -like 'FAIL*' }).Count -gt 0) {
            $script:Summary['invalid transition validation'] = 'FAIL (invalid transition accepted)'
        }
        else {
            $script:Summary['invalid transition validation'] = 'UNKNOWN (unexpected response)'
        }
    }

    if ($null -ne $validPayload) {
        $unauthResponse = Send-AuditRequest -Test 'Mutation without Authorization (dry-run)' -Method 'POST' -Path '/rentals' -Body $validPayload -WithoutAuthorization
        if ($null -eq $unauthResponse) { return }
        if ($unauthResponse.Status -in @(401, 403)) {
            $unauthVerdict = 'PASS (unauthorized request rejected)'
            $script:Summary['Authentication'] = 'VERIFIED (unauthorized mutation rejected)'
        }
        elseif ($unauthResponse.Status -ge 200 -and $unauthResponse.Status -lt 300 -and (Get-ApplicationSuccess -Body $unauthResponse.Body) -ne $false) {
            $unauthVerdict = 'FAIL (unauthorized request accepted)'
            $script:Summary['Authentication'] = 'NOT VERIFIED (unauthorized mutation accepted)'
        }
        else {
            $unauthVerdict = 'UNKNOWN (unexpected response)'
            $script:Summary['Authentication'] = 'UNKNOWN (unauthorized mutation response inconclusive)'
        }
        Add-AuditRow -Test 'Mutation without Authorization (dry-run)' -Http (Get-AuditHttpLabel -Response $unauthResponse) -Result (Get-ResponseSummary -Response $unauthResponse) -Verdict $unauthVerdict
    }
    else {
        Add-AuditRow -Test 'Mutation without Authorization (dry-run)' -Http '-' -Result 'NOT RUN: valid payload prerequisites were unavailable.' -Verdict 'NOT VERIFIABLE'
    }

    $stockAfter = $null
    if ($null -ne $availableItem) {
        $stockAfterResponse = Send-AuditRequest -Test 'GET item after dry-run tests' -Method 'GET' -Path ('/items/' + $availableItem.id)
        if ($null -eq $stockAfterResponse) { return }
        $stockAfterItem = Get-ItemObject -Body $stockAfterResponse.Body
        $stockValue = 0L
        $stockAfterRaw = Get-PropertyValue -InputObject $stockAfterItem -Name 'stock'
        $stockAfterReadable = $stockAfterResponse.Status -ge 200 -and $stockAfterResponse.Status -lt 300 -and [long]::TryParse([string]$stockAfterRaw, [ref]$stockValue)
        if ($stockAfterReadable) {
            $stockAfter = $stockValue
            $stockVerdict = if ($stockAfter -eq $availableItem.stock) { 'PASS' } else { 'FAIL' }
            Add-AuditRow -Test 'Stock unchanged after dry-run tests' -Http (Get-AuditHttpLabel -Response $stockAfterResponse) -Result ('stock before=' + $availableItem.stock + '; stock after=' + $stockAfter + '; ' + (Get-ResponseSummary -Response $stockAfterResponse)) -Verdict $stockVerdict
        }
        else {
            Add-AuditRow -Test 'Stock unchanged after dry-run tests' -Http (Get-AuditHttpLabel -Response $stockAfterResponse) -Result ('Could not read stock after the audit; ' + (Get-ResponseSummary -Response $stockAfterResponse)) -Verdict 'UNKNOWN'
        }
    }
    else {
        Add-AuditRow -Test 'Stock unchanged after dry-run tests' -Http '-' -Result 'NOT RUN: no available item with positive stock was found.' -Verdict 'NOT VERIFIABLE'
    }

    $rentalsAfterResponse = Send-AuditRequest -Test 'GET rentals after dry-run tests' -Method 'GET' -Path '/rentals'
    if ($null -eq $rentalsAfterResponse) { return }
    $rentalsAfterReadable = $rentalsAfterResponse.Status -ge 200 -and $rentalsAfterResponse.Status -lt 300 -and (Get-ApplicationSuccess -Body $rentalsAfterResponse.Body) -ne $false -and (Test-ApiCollection -Body $rentalsAfterResponse.Body -CollectionNames @('rentals', 'data'))
    if ($rentalsAfterReadable) {
        $script:RentalCountAfter = @(Get-ApiCollection -Body $rentalsAfterResponse.Body -CollectionNames @('rentals', 'data')).Count
        if ($null -ne $script:RentalCountBefore) {
            $countVerdict = if ($script:RentalCountBefore -eq $script:RentalCountAfter) { 'PASS' } else { 'FAIL (visible rental count changed)' }
            Add-AuditRow -Test 'Rental list count unchanged' -Http (Get-AuditHttpLabel -Response $rentalsAfterResponse) -Result ('returned rental rows before=' + $script:RentalCountBefore + '; after=' + $script:RentalCountAfter + '; ' + (Get-ResponseSummary -Response $rentalsAfterResponse)) -Verdict $countVerdict
        }
        else {
            Add-AuditRow -Test 'Rental list count unchanged' -Http (Get-AuditHttpLabel -Response $rentalsAfterResponse) -Result ((Get-ResponseSummary -Response $rentalsAfterResponse) + '; no readable before-count was available.') -Verdict 'NOT VERIFIABLE'
        }
    }
    else {
        Add-AuditRow -Test 'Rental list count unchanged' -Http (Get-AuditHttpLabel -Response $rentalsAfterResponse) -Result (Get-ResponseSummary -Response $rentalsAfterResponse) -Verdict 'NOT VERIFIABLE'
    }

    if ($null -ne $stockAfter -and $stockAfter -ne $availableItem.stock) {
        $script:Summary['database unchanged'] = 'FAIL (selected item stock changed)'
    }
    elseif ($null -ne $script:RentalCountBefore -and $null -ne $script:RentalCountAfter -and $script:RentalCountBefore -ne $script:RentalCountAfter) {
        $script:Summary['database unchanged'] = 'FAIL (returned rental row count changed)'
    }
    elseif ($null -ne $stockAfter -and $stockAfter -eq $availableItem.stock -and $null -ne $script:RentalCountBefore -and $null -ne $script:RentalCountAfter) {
        $script:Summary['database unchanged'] = 'PASS (selected item stock and returned rental row count unchanged)'
    }
    elseif ($null -ne $stockAfter -and $stockAfter -eq $availableItem.stock) {
        $script:Summary['database unchanged'] = 'PARTIAL (selected item stock unchanged; rental count not comparable)'
    }
    else {
        $script:Summary['database unchanged'] = 'UNKNOWN (final stock or comparable rental count unavailable)'
    }
}

function Write-AuditReport {
    if ($script:BaselineItems.Count -gt 0) {
        Write-Host ''
        Write-Host 'Baseline items (id, stock, status):'
        $script:BaselineItems | Format-Table -Property id, stock, status -AutoSize | Out-String -Width 180 | Write-Host
    }

    Write-Host 'Rental API Demo audit:'
    if ($script:AuditRows.Count -gt 0) {
        $script:AuditRows | Format-Table -Property Test, HTTP, Result, Verdict -Wrap -AutoSize | Out-String -Width 240 | Write-Host
    }
    else {
        Write-Host 'No tests were run.'
    }

    Write-Host 'Summary:'
    foreach ($key in $script:Summary.Keys) {
        Write-Host ($key + ': ' + $script:Summary[$key])
    }

    if (-not [string]::IsNullOrWhiteSpace($script:StopReason)) {
        Write-Host ('Stopped: ' + $script:StopReason)
    }

    Write-Host 'Dry-Run limits: this audit does not verify stock persistence/decrement/restore, transaction atomicity, concurrency protection, or double-restore.'
}

try {
    Invoke-RentalAudit
}
catch {
    Add-AuditRow -Test 'Local audit script' -Http 'LOCAL ERROR' -Result (Get-SafeLocalError -ErrorRecord $_) -Verdict 'INCOMPLETE (sanitized local diagnostic; API credentials withheld)'
}
finally {
    Write-AuditReport
}
