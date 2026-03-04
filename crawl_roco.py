import requests
from bs4 import BeautifulSoup
import json
import re
import time
import urllib3

# 禁用安全请求警告（针对 verify=False）
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def crawl_all_roco():
    base_url = "https://roco.dvg.cn/spirits.php?type=&p="
    pets_data = []
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    print("🚀 开始全站卷走任务（加强版）...")
    

    for page in range(1, 111):
        url = f"{base_url}{page}"
        success = False
        retries = 3  # 每页最多重试 3 次

        while not success and retries > 0:
            try:
                # 💡 关键修改 1: verify=False 绕过 SSL 问题
                # 💡 关键修改 2: 增加 timeout 防止死等
                response = requests.get(url, headers=headers, timeout=15, verify=False)
                response.encoding = 'utf-8'
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # ... [保持之前的精准抓取逻辑不变] ...
                no_spans = soup.find_all('span', class_=lambda x: x and 'font-12' in x)
                page_count = 0
                for span in no_spans:
                    if '编号:' not in span.get_text(): continue
                    raw_id_text = span.get_text(strip=True)
                    pet_no = raw_id_text.replace('编号:', '').strip()
                    pet_id = pet_no.zfill(3)

                    parent_container = span.parent
                    name_a = parent_container.find('a', href=re.compile(r'/spirit_info\.php\?id='))
                    
                    if name_a:
                        name = name_a.get_text(strip=True)
                        if not name or "组" in name: continue
                        
                        category = "extinct"
                        if int(pet_no) <= 3: category = "scene"
                        
                        pets_data.append({"id": pet_id, "name": name, "category": category})
                        page_count += 1
                
                print(f"✅ 第 {page}/110 页完成，本页 {page_count} 只，总计 {len(pets_data)} 只。")
                success = True
                time.sleep(1) # 稍微多歇会儿

            except Exception as e:
                retries -= 1
                print(f"⚠️ 第 {page} 页连接波动 (剩余重试: {retries}): {e}")
                time.sleep(3) # 报错后歇长一点再试

    # 排序并保存
    pets_data.sort(key=lambda x: int(x['id']))
    with open('pets.json', 'w', encoding='utf-8') as f:
        json.dump(pets_data, f, ensure_ascii=False, indent=4)
    
    print(f"\n🎉 卷走成功！最终获取 {len(pets_data)} 只宠物。")

if __name__ == "__main__":
    crawl_all_roco()