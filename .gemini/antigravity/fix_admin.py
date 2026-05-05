import os

file_path = r'c:\Users\NANDOLIYA BILAL\Downloads\visa\visa\admin\index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We need to find where the script starts and where it ends
# Or just find the "fetchDashboardData" part

# Let's find the closing of the DOMContentLoaded listener
# which is normally before fetchDashboardData

new_content = []
skip = False
for line in lines:
    if "document.querySelectorAll('.admin-nav-item').forEach(item => {" in line:
        new_content.append(line)
        new_content.append("                item.addEventListener('click', () => {\n")
        new_content.append("                    if (window.innerWidth <= 991) {\n")
        new_content.append("                        sidebar.classList.remove('active');\n")
        new_content.append("                        overlay.classList.remove('active');\n")
        new_content.append("                    }\n")
        new_content.append("                });\n")
        new_content.append("            });\n")
        new_content.append("\n")
        new_content.append("            fetchDashboardData(token);\n")
        new_content.append("        });\n")
        new_content.append("\n")
        new_content.append("        async function resendAllReceipts() {\n")
        new_content.append("            const token = localStorage.getItem('token');\n")
        new_content.append("            if (!confirm('Are you sure you want to resend receipts?')) return;\n")
        new_content.append("            try {\n")
        new_content.append("                const res = await fetch('/api/admin/resend-all-receipts', {\n")
        new_content.append("                    method: 'POST',\n")
        new_content.append("                    headers: { 'Authorization': 'Bearer ' + token }\n")
        new_content.append("                });\n")
        new_content.append("                const data = await res.json();\n")
        new_content.append("                alert(data.message);\n")
        new_content.append("            } catch (err) { alert('Failed to resend'); }\n")
        new_content.append("        }\n")
        new_content.append("\n")
        new_content.append("        let currentApplications = { visa: [], passport: [] };\n")
        new_content.append("\n")
        new_content.append("        async function fetchDashboardData(token) {\n")
        new_content.append("            try {\n")
        new_content.append("                const headers = { 'Authorization': 'Bearer ' + token };\n")
        new_content.append("                const appsRes = await fetch('/api/admin/applications', { headers });\n")
        new_content.append("                const appsData = await appsRes.json();\n")
        # Now we need to skip the broken lines until we reach "const usersRes" or similar
        skip = True
        continue
    
    if skip:
        if "const usersRes = await fetch('/api/admin/users'" in line or "const usersRes = await fetch" in line:
            new_content.append(line)
            skip = False
        continue
    
    new_content.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_content)

print("Fixed admin/index.html")
