import json

def generate_roco_data():
    pets = []
    # 假设目前洛克图鉴到 3200 号
    total_pets = 3200 
    
    for i in range(1, total_pets + 1):
        # 格式化编号，如 1 变成 "001"
        pet_id = str(i).zfill(3)
        
        # 初始逻辑：默认全放在“绝版”或者“待分类”中
        # 你可以根据编号区间先做粗略分类
        category = "extinct" 
        if i <= 3: category = "scene" # 三主宠设为场景
        
        pets.append({
            "id": pet_id,
            "name": f"宠物{pet_id}", # 暂时用占位名，之后可以爬取真名
            "category": category
        })
    
    # 保存为 JSON 文件
    with open('pets.json', 'w', encoding='utf-8') as f:
        json.dump(pets, f, ensure_ascii=False, indent=4)
    print(f"成功生成 {total_pets} 条宠物数据到 pets.json！")

if __name__ == "__main__":
    generate_roco_data()