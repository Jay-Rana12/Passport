import os

file_path = r'c:\Users\NANDOLIYA BILAL\Downloads\visa\visa\admin\index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add button
btn_html = '<button onclick="resendAllReceipts()" style="margin-left:20px;padding:8px 15px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.8rem;">Resend All Receipts</button>'
content = content.replace('Control Panel</div>', 'Control Panel</div>' + btn_html)

# Add script before </body>
script_html = """
<script>
async function resendAllReceipts() {
    const token = localStorage.getItem('token');
    if (!confirm('Are you sure you want to resend receipts?')) return;
    try {
        const res = await fetch('/api/admin/resend-all-receipts', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        alert(data.message);
    } catch (err) { alert('Failed to resend'); }
}
</script>
"""
content = content.replace('</body>', script_html + '</body>')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated admin/index.html")
