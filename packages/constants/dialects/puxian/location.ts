/**
 * Puxian dialect - Location/Region data
 * Geographic divisions for Putian area where Puxian dialect is spoken
 */

/**
 * Counties/Districts in Putian (莆田市行政区划)
 */
export const counties = ['城厢区', '涵江区', '荔城区', '秀屿区', '仙游县'];

/**
 * Towns/Townships under each county (各区县下属乡镇)
 * Index corresponds to counties array
 */
export const towns = [
  ['龙桥街道', '凤凰山街道', '霞林街道', '常太镇', '华亭镇', '灵川镇', '东海镇'],
  ['涵东街道', '涵西街道', '三江口镇', '白塘镇', '国欢镇', '梧塘镇', '江口镇', '萩芦镇', '白沙镇', '庄边镇', '新县镇', '大洋乡'],
  ['镇海街道', '拱辰街道', '西天尾镇', '黄石镇', '新度镇', '北高镇'],
  ['笏石镇', '东庄镇', '忠门镇', '东埔镇', '东峤镇', '埭头镇', '平海镇', '南日镇', '湄洲镇', '山亭镇', '月塘乡'],
  ['鲤城街道', '枫亭镇', '榜头镇', '郊尾镇', '度尾镇', '鲤南镇', '赖店镇', '盖尾镇', '园庄镇', '大济镇',
    '龙华镇', '钟山镇', '游洋镇', '西苑乡', '石苍乡', '社硎乡', '书峰乡', '菜溪乡'],
];

/**
 * Metadata about the Puxian dialect
 */
export const dialectInfo = {
  name: '莆仙话',
  nameEn: 'Puxian',
  region: '福建省莆田市',
  regionEn: 'Putian, Fujian',
  isoCode: 'cpx', // ISO 639-3 code
  alternateNames: ['兴化话', 'Hinghwa', 'Xinghua'],
};
