// 分类体系：想改分类/加分类，改这个文件即可
export const EXPENSE_CATEGORIES = [
  {
    key: '生存',
    hint: '吃住行·日用·健康',
    color: '#16a34a',
    subs: ['吃饭', '交通', '居住', '日用', '健康', '通讯', '其他'],
  },
  {
    key: '情绪',
    hint: '吃喝玩乐·纯享受',
    color: '#f59e0b',
    subs: ['奶茶零食', '聚餐下馆子', '娱乐', '悦己购物', '旅行', '其他'],
  },
  {
    key: '价值',
    hint: '学习·成长·投资自己',
    color: '#3b82f6',
    subs: ['学习', '工具数码', '健身', '自我投资', '其他'],
  },
]

export const INCOME_CATEGORIES = ['工资', '家人', '红包', '报销', '退款', '其他']

export function categoryLabel(r) {
  if (r.type === 'advance_refund') return '代付收回'
  return r.main_category ? `${r.main_category}·${r.sub_category}` : r.sub_category
}

// 关键词自动分类：按顺序匹配 note，首个命中生效（只做建议，用户可改）
const KEYWORD_RULES = [
  { main: '生存', sub: '吃饭', keywords: ['美团', '外卖', '饿了么', '麦当劳', '肯德基', '瑞幸', '星巴克', '沙县', '食堂', '早餐', '午餐', '晚餐', '快餐', '面馆'] },
  { main: '生存', sub: '交通', keywords: ['滴滴', '高德', '打车', '地铁', '公交', '12306', '加油', '中国石化', '中国石油', '哈啰', '青桔', '共享单车'] },
  { main: '生存', sub: '居住', keywords: ['房租', '水费', '电费', '燃气', '物业', '宽带', '话费', '中国移动', '中国联通', '中国电信'] },
  { main: '生存', sub: '日用', keywords: ['超市', '便利店', '京东到家', '永辉', '盒马', '罗森', '711', '日用品'] },
  { main: '生存', sub: '健康', keywords: ['医院', '药房', '药店', '挂号', '体检', '诊所', '口腔'] },
  { main: '情绪', sub: '奶茶零食', keywords: ['奶茶', '茶百道', '蜜雪', '喜茶', '奈雪', '霸王茶姬', '古茗', '沪上阿姨', '蛋糕', '甜品', '零食', '咖啡'] },
  { main: '情绪', sub: '聚餐下馆子', keywords: ['海底捞', '烤肉', '火锅', '烧烤', '串串', '日料', '西餐', '餐厅', '酒馆', '酒吧'] },
  { main: '情绪', sub: '娱乐', keywords: ['电影', '腾讯视频', '爱奇艺', '优酷', '网易云', 'qq音乐', '游戏', 'steam', '王者', 'ktv', '剧本杀', '密室', '演唱会', '音乐节', '会员'] },
  { main: '情绪', sub: '悦己购物', keywords: ['淘宝', '天猫', '拼多多', '抖音', '唯品会', '得物', '小红书', '优衣库', '化妆品', '美妆', '衣服'] },
  { main: '情绪', sub: '旅行', keywords: ['携程', '去哪儿', '飞猪', '酒店', '民宿', '航空', '机票', '高铁', '火车票', '景区', '门票'] },
  { main: '价值', sub: '学习', keywords: ['书店', '当当', '微信读书', '得到', '网课', '培训', '考试', '报名', '课程', '图书', '文具'] },
  { main: '价值', sub: '工具数码', keywords: ['京东', '小米', '苹果', '华为', '数码', '电脑', '键盘', '耳机'] },
  { main: '价值', sub: '健身', keywords: ['健身房', '瑜伽', '游泳', '迪卡侬', '运动', 'keep'] },
]

const INCOME_KEYWORD_RULES = [
  { sub: '工资', keywords: ['工资', '薪资', '奖金', '实习'] },
  { sub: '家人', keywords: ['妈妈', '爸爸', '老爸', '老妈'] },
  { sub: '红包', keywords: ['红包'] },
  { sub: '报销', keywords: ['报销'] },
  { sub: '退款', keywords: ['退款', '退货'] },
]

const ADVANCE_KEYWORDS = ['代付', '垫付', 'AA', 'aa']

export function suggestCategory(note) {
  if (!note) return null
  const n = note.toLowerCase()
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((k) => n.includes(k.toLowerCase()))) {
      return { main: rule.main, sub: rule.sub }
    }
  }
  return null
}

export function suggestIncome(note) {
  if (!note) return null
  for (const rule of INCOME_KEYWORD_RULES) {
    if (rule.keywords.some((k) => note.includes(k))) return rule.sub
  }
  return null
}

export function suggestAdvance(note) {
  if (!note) return false
  return ADVANCE_KEYWORDS.some((k) => note.includes(k))
}

// 用户自建的小类：按大类（收入用"收入"作组名）记忆在本地
const CUSTOM_SUBS_KEY = 'jy_custom_subs'

export function getCustomSubs(group) {
  try {
    const all = JSON.parse(localStorage.getItem(CUSTOM_SUBS_KEY) || '{}')
    return Array.isArray(all[group]) ? all[group] : []
  } catch {
    return []
  }
}

export function addCustomSub(group, sub) {
  let all = {}
  try {
    all = JSON.parse(localStorage.getItem(CUSTOM_SUBS_KEY) || '{}')
  } catch {
    all = {}
  }
  const list = Array.isArray(all[group]) ? all[group] : []
  if (!list.includes(sub)) list.push(sub)
  all[group] = list
  localStorage.setItem(CUSTOM_SUBS_KEY, JSON.stringify(all))
}
