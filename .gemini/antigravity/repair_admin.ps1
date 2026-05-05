$path = 'c:\Users\NANDOLIYA BILAL\Downloads\visa\visa\admin\index.html'
$content = Get-Content $path -Raw

# 1. Add Button in Header
$btn = '                    <button onclick="resendAllReceipts()" style="margin-left: 20px; padding: 8px 15px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 700;"> <i class="fas fa-paper-plane"></i> Resend Missing Receipts</button>'
$content = $content.Replace('Control Panel</div>', 'Control Panel</div>' + $btn)

# 2. Add JS function before </body>
$script = @"

    <script>
    async function resendAllReceipts() {
        const token = localStorage.getItem('token');
        if (!confirm('Are you sure you want to resend receipts to all submitted forms?')) return;
        
        try {
            const res = await fetch('/api/admin/resend-all-receipts', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            alert(data.message);
        } catch (err) {
            alert('Connection failed. Please check server.');
        }
    }
    </script>
</body>
"@

$content = $content.Replace('</body>', $script)

Set-Content $path $content
Write-Host "Successfully fixed admin/index.html"
