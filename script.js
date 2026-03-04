// 💡 1. 跨页面读取：从浏览器拿走你的勾选清单
let savedCheckedIds = JSON.parse(localStorage.getItem('roco_checked_ids')) || [];

async function init() {
    try {
        const response = await fetch('pets.json');
        const petsData = await response.json();

        // 识别当前页面路径
        const isOthersPage = window.location.pathname.includes('others.html');

        petsData.forEach(pet => {
            if (!isOthersPage) {
                // 【主页逻辑】：按原有 category 渲染
                const containerId = getPrimaryContainerId(pet.category);
                renderPet(pet, containerId, pet.category);
            } else {
                // 【其他分类页逻辑】：按 tags 数组渲染（一个宠物可以有多个标签）
                if (pet.tags && pet.tags.length > 0) {
                    pet.tags.forEach(tag => {
                        const tagContainerId = getTagContainerId(tag);
                        renderPet(pet, tagContainerId, tag);
                    });
                }
            }
        });

        // 绑定同步监听：点击一个，全站同步
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('pet-cb')) {
                const petId = e.target.getAttribute('data-id');
                const isChecked = e.target.checked;

                // 💡 跨页面/跨分类同步逻辑
                document.querySelectorAll(`.pet-cb[data-id="${petId}"]`).forEach(cb => {
                    cb.checked = isChecked;
                });

                saveProgress();
                update();
            }
        });

        update();
        
        // 💡 2. 搜索与精准跳转功能
        const searchInput = document.getElementById('pet-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.trim().toLowerCase();
                const allItems = document.querySelectorAll('.pet-item');

                allItems.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    // 显隐过滤
                    if (text.includes(term)) {
                        item.style.display = 'inline-flex';
                    } else {
                        item.style.display = 'none';
                    }
                });

                // 🚀 核心：如果输入的是纯数字编号（如 768），实现自动滚动
                if (/^\d+$/.test(term) && term.length >= 2) {
                    // 寻找对应的 checkbox
                    const targetCb = document.querySelector(`.pet-cb[data-id$="${term}"]`);
                    if (targetCb) {
                        const targetItem = targetCb.parentElement;
                        // 平滑滚动到视野中央
                        targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // 增加蓝色高亮反馈
                        targetItem.style.outline = '3px solid #3498db';
                        setTimeout(() => targetItem.style.outline = 'none', 2000);
                    }
                }
            });
        }

    } catch (e) { console.error("数据加载失败:", e); }
}

// 💡 2. 映射表补全：对应 others.html 里的 5+ 容器 ID
function getTagContainerId(tag) {
    const mapping = {
        'king': 'king-pet-list',            // 精灵王
        'divine': 'divine-pet-list',        // 奉神
        'awaken-fixed': 'awaken-fixed-list',// 觉醒重生：常驻
        'annual': 'annual-list',            // 觉醒重生：年费
        'king-alt': 'king-alt-list',        // 觉醒重生：精灵王(特殊)
        'return': 'return-list',            // 觉醒重生：活动回归
        'bbs': 'bbs-list',                  // 觉醒重生：论坛宠物
        'sentry-no': 'pay-fixed-list',      // 哨兵：不可交易
        'sentry-yes': 'pay-limit-list',     // 哨兵：可以交易
        'gacha': 'extinct-list'             // 扭蛋机
    };
    return mapping[tag] || 'extinct-list';
}

function getPrimaryContainerId(cat) {
    const mapping = {
        'scene': 'scene-pet-list',
        'fixed-act': 'fixed-pet-list',
        'news': 'news-pet-list',
        'pay-fixed': 'pay-fixed-list',
        'pay-limit': 'pay-limit-list',
        'extinct': 'extinct-list'
    };
    return mapping[cat] || 'extinct-list';
}

function renderPet(pet, containerId, label) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isChecked = savedCheckedIds.includes(pet.id) ? 'checked' : '';
    const html = `
        <label class="pet-item">
            <input type="checkbox" class="pet-cb" data-id="${pet.id}" data-cat="${label}" ${isChecked}>
            ${pet.id} ${pet.name}
        </label>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function saveProgress() {
    const currentChecked = Array.from(document.querySelectorAll('.pet-cb:checked'))
                                .map(cb => cb.getAttribute('data-id'));
    const uniqueIds = [...new Set(currentChecked)]; 
    localStorage.setItem('roco_checked_ids', JSON.stringify(uniqueIds));
}

// 💡 3. 统计逻辑补全：确保 5 个进度条都能动起来
function update() {
    const updateBar = (selector, barId, textId) => {
        const items = document.querySelectorAll(selector);
        const checked = Array.from(items).filter(i => i.checked).length;
        const total = items.length;
        const percent = total === 0 ? 0 : Math.round((checked/total)*100);
        const bar = document.getElementById(barId);
        const text = document.getElementById(textId);
        if(bar) bar.value = percent;
        if(text) text.innerText = `${checked} / ${total} (${percent}%)`;
    };

    // 精灵王/奉神
    updateBar('.pet-cb[data-cat="king"]', 'king-bar', 'king-stat');
    updateBar('.pet-cb[data-cat="divine"]', 'divine-bar', 'divine-stat');
    
    // 觉醒重生系列（5个全部补齐）
    updateBar('.pet-cb[data-cat="awaken-fixed"]', 'awaken-fixed-bar', 'awaken-fixed-stat');
    updateBar('.pet-cb[data-cat="annual"]', 'annual-bar', 'annual-stat');
    updateBar('.pet-cb[data-cat="king-alt"]', 'king-alt-bar', 'king-alt-stat');
    updateBar('.pet-cb[data-cat="return"]', 'return-bar', 'return-stat');
    updateBar('.pet-cb[data-cat="bbs"]', 'bbs-bar', 'bbs-stat');

    // 哨兵等其他
    updateBar('.pet-cb[data-cat="sentry-no"]', 'pay-fixed-bar', 'pay-fixed-stat');
    updateBar('.pet-cb[data-cat="sentry-yes"]', 'pay-limit-bar', 'pay-limit-stat');
}

init();






































// // 💡 1. 声明一个全局变量来保存从浏览器里读取到的勾选状态
// let savedCheckedIds = JSON.parse(localStorage.getItem('roco_checked_ids')) || [];

// // 统计逻辑函数 (保持不变)
// function update() {
//     const updateBar = (selector, barId, textId) => {
//         const items = document.querySelectorAll(selector);
//         const checked = Array.from(items).filter(i => i.checked).length;
//         const total = items.length;
//         const percent = total === 0 ? 0 : Math.round((checked/total)*100);
//         const bar = document.getElementById(barId);
//         const text = document.getElementById(textId);
//         if(bar) bar.value = percent;
//         if(text) text.innerText = `${checked} / ${total} (${percent}%)`;
//     };

//     updateBar('.pet-cb', 'total-bar', 'total-stat');
//     updateBar('.pet-cb[data-cat="scene"]', 'scene-bar', 'scene-stat');
//     updateBar('.pet-cb[data-cat="fixed-act"]', 'fixed-bar', 'fixed-stat');
//     updateBar('.pet-cb[data-cat="news"]', 'news-bar', 'news-stat');
//     updateBar('.pet-cb[data-cat="bbs"]', 'bbs-bar', 'bbs-stat');
//     updateBar('.pet-cb[data-cat="pay-fixed"]', 'pay-fixed-bar', 'pay-fixed-stat');
//     updateBar('.pet-cb[data-cat="pay-limit"]', 'pay-limit-bar', 'pay-limit-stat');
//     updateBar('.pet-cb[data-cat="extinct"]', 'extinct-bar', 'extinct-stat');
    

//     // 💡 关键：每次统计完，顺便把当前所有被勾选的 ID 存入浏览器
//     const currentChecked = Array.from(document.querySelectorAll('.pet-cb:checked'))
//                                 .map(cb => cb.getAttribute('data-id'));
//     localStorage.setItem('roco_checked_ids', JSON.stringify(currentChecked));
// }

// // 异步加载并渲染 (新逻辑)
// async function init() {
//     try {
//         const response = await fetch('pets.json');
//         const petsData = await response.json();

//         petsData.forEach(pet => {
//             let containerId = "";
//             if (pet.category === 'scene') containerId = 'scene-pet-list';
//             else if (pet.category === 'fixed-act') containerId = 'fixed-pet-list';
//             else if (pet.category === 'news') containerId = 'news-pet-list'; // 💡 对应新 ID
//             else if (pet.category === 'bbs') containerId = 'bbs-pet-list';   // 💡 新增分类判定
//             else if (pet.category === 'pay-fixed') containerId = 'pay-fixed-list';
//             else if (pet.category === 'pay-limit') containerId = 'pay-limit-list';
//             else if (pet.category === 'extinct') containerId = 'extinct-list';

//             const container = document.getElementById(containerId);
//             if (container) {
//                 // 💡 关键：判断这个宠物的 ID 是否在我们的保存名单里
//                 const isChecked = savedCheckedIds.includes(pet.id) ? 'checked' : '';
                
//                 const html = `
//                     <label class="pet-item">
//                         <input type="checkbox" class="pet-cb" 
//                                data-id="${pet.id}" 
//                                data-cat="${pet.category}" 
//                                ${isChecked}> 
//                         ${pet.id} ${pet.name}
//                     </label>
//                 `;
//                 container.insertAdjacentHTML('beforeend', html);
//             }
//         });

//         document.addEventListener('change', (e) => {
//             if(e.target.classList.contains('pet-cb')) update();
//         });

//         // 💡 搜索功能逻辑
// const searchInput = document.getElementById('pet-search');
// searchInput.addEventListener('input', (e) => {
//     const term = e.target.value.toLowerCase(); // 获取搜索词并转为小写
//     const allItems = document.querySelectorAll('.pet-item'); // 选中所有宠物标签

//     allItems.forEach(item => {
//         const text = item.textContent.toLowerCase(); // 获取宠物的名字和编号文本
//         // 💡 关键：如果不包含搜索词，就通过 CSS 隐藏它
//         if (text.includes(term)) {
//             item.style.display = 'inline-flex'; // 或者你之前定义的 display 方式
//         } else {
//             item.style.display = 'none';
//         }
//     });
// });

//         update(); 
//     } catch (e) {
//         console.error("加载 JSON 失败，请确保 pets.json 在同级目录下", e);
//     }
// }

// init();
























// // 1. 先放数据
// const mockPets = [
//     { id: "001", name: "喵喵", category: "scene" },
//     { id: "004", name: "小火苗", category: "scene" },
//     { id: "T01", name: "泰西斯", category: "fixed-act" },
//     { id: "T02", name: "提亚", category: "fixed-act" },
//     { id: "L011", name: "新闻宠A", category: "news" },
//     { id: "009", name: "喵喵喵", category: "pay-fixed" },
//     { id: "0044", name: "喵喵1", category: "pay-limit" },
//     { id: "0012", name: "圣光少校", category: "extinct" }
// ];

// 改为从文件读取数据
// async function loadPets() {
//     try {
//         // 读取刚才生成的 json
//         const response = await fetch('pets.json');
//         const allPets = await response.json();
        
//         // 调用你之前的 init 函数，但传入真实数据
//         renderPets(allPets); 
//     } catch (error) {
//         console.error("加载数据失败:", error);
//     }
// }

// function renderPets(petsData) {
//     petsData.forEach(pet => {
//         // ... 这里放你之前的 if-else 分类逻辑 ...
//         // ... 以及 insertAdjacentHTML 逻辑 ...
//     });
//     update(); // 渲染完后统计一次
// }

// // 启动
// loadPets();

// // 2. 统计逻辑函数 (update)
// function update() {
//     const updateBar = (selector, barId, textId) => {
//         const items = document.querySelectorAll(selector);
//         const checked = Array.from(items).filter(i => i.checked).length;
//         const total = items.length;
//         const percent = total === 0 ? 0 : Math.round((checked/total)*100);
//         const bar = document.getElementById(barId);
//         const text = document.getElementById(textId);
//         if(bar) bar.value = percent;
//         if(text) text.innerText = `${checked} / ${total} (${percent}%)`;
//     };

//     updateBar('.pet-cb', 'total-bar', 'total-stat');
//     updateBar('.pet-cb[data-cat="scene"]', 'scene-bar', 'scene-stat');
//     updateBar('.pet-cb[data-cat="fixed-act"]', 'fixed-bar', 'fixed-stat');
//     updateBar('.pet-cb[data-cat="news"]', 'news-bar', 'news-stat');
//     updateBar('.pet-cb[data-cat="pay-fixed"]', 'pay-fixed-bar', 'pay-fixed-stat');
//     updateBar('.pet-cb[data-cat="pay-limit"]', 'pay-limit-bar', 'pay-limit-stat');
//     updateBar('.pet-cb[data-cat="extinct"]', 'extinct-bar', 'extinct-stat');
// }

// // 3. 初始化渲染函数 (init)
// function init() {
//     mockPets.forEach(pet => {
//         let containerId = "";
//         if (pet.category === 'scene') containerId = 'scene-pet-list';
//         else if (pet.category === 'fixed-act') containerId = 'fixed-pet-list';
//         else if (pet.category === 'news') containerId = 'limited-list';
//         else if (pet.category === 'pay-fixed') containerId = 'pay-fixed-list';
//         else if (pet.category === 'pay-limit') containerId = 'pay-limit-list';
//         else if (pet.category === 'extinct') containerId = 'extinct-list';

//         const container = document.getElementById(containerId);
//         if (container) {
//             const html = `
//                 <label class="pet-item">
//                     <input type="checkbox" class="pet-cb" data-cat="${pet.category}">
//                     ${pet.id} ${pet.name}
//                 </label>
//             `;
//             container.insertAdjacentHTML('beforeend', html);
//         }
//     });

//     // 监听点击事件
//     document.addEventListener('change', (e) => {
//         if(e.target.classList.contains('pet-cb')) update();
//     });

//     update(); 
// }

// // 4. 最后这行最关键：真正开始运行！
// init();
