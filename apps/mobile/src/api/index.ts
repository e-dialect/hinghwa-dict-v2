/**
 * uni-app 特定的 API 适配层
 * 
 * 这个文件只包含需要调用 uni.* 接口的移动端专用功能
 * 大部分 API 直接从 packages/services 导出使用
 */

import { getPocketBase, initPocketBase } from 'packages/services';

// 初始化 Pocketbase 客户端 (uni-app 环境)
const pb = initPocketBase(process.env.POCKETBASE_URL || 'http://localhost:8090');

// uni-app 存储适配 - 自动同步认证状态到本地存储
pb.authStore.onChange(() => {
  uni.setStorageSync('pb_auth', pb.authStore.exportToCookie());
  if (pb.authStore.model) {
    uni.setStorageSync('userInfo', pb.authStore.model);
  } else {
    uni.removeStorageSync('userInfo');
  }
});

// 初始化时加载已保存的认证信息
try {
  const savedAuth = uni.getStorageSync('pb_auth');
  if (savedAuth) {
    pb.authStore.loadFromCookie(savedAuth);
  }
} catch (e) {
  console.error('Failed to load auth from storage:', e);
}

export { pb };

/**
 * uni-app 专用：微信小程序登录
 * @returns Promise<{user, token}>
 */
export async function wechatMiniProgramLogin() {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: async (loginRes) => {
        try {
          const code = loginRes.code;
          // 调用后端的微信登录接口
          const result = await pb.collection('users').authWithOAuth2({
            provider: 'wechat',
            code: code
          });
          
          resolve({
            user: result.record,
            token: result.token
          });
        } catch (error) {
          reject(error);
        }
      },
      fail: (error) => {
        reject(error);
      }
    });
  });
}

/**
 * uni-app 专用：获取用户信息（微信）
 */
export async function getWechatUserInfo() {
  return new Promise((resolve, reject) => {
    uni.getUserInfo({
      provider: 'weixin',
      success: (infoRes) => {
        resolve(infoRes.userInfo);
      },
      fail: (error) => {
        reject(error);
      }
    });
  });
}

/**
 * uni-app 专用：播放音频
 * @param {string} audioUrl - 音频URL
 */
export function playAudio(audioUrl) {
  const innerAudioContext = uni.createInnerAudioContext();
  innerAudioContext.src = audioUrl;
  innerAudioContext.play();
  
  innerAudioContext.onError((error) => {
    console.error('Audio play error:', error);
    uni.showToast({
      title: '播放失败',
      icon: 'none'
    });
  });
  
  return innerAudioContext;
}

/**
 * uni-app 专用：上传文件
 * @param {string} collectionName - Collection名称
 * @param {string} recordId - 记录ID
 * @param {string} fieldName - 字段名
 * @returns Promise<string> 上传后的文件URL
 */
export function uploadFile(collectionName, recordId, fieldName) {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        uni.uploadFile({
          url: `${pb.baseUrl}/api/collections/${collectionName}/records/${recordId}`,
          filePath: tempFilePath,
          name: fieldName,
          header: {
            'Authorization': pb.authStore.token
          },
          success: (uploadRes) => {
            if (uploadRes.statusCode === 200) {
              const data = JSON.parse(uploadRes.data);
              const fileUrl = pb.getFileUrl(data, data[fieldName]);
              resolve(fileUrl);
            } else {
              reject(new Error('上传失败'));
            }
          },
          fail: (error) => {
            reject(error);
          }
        });
      },
      fail: (error) => {
        reject(error);
      }
    });
  });
}

/**
 * uni-app 专用：选择并上传音频
 */
export function uploadAudio(collectionName, recordId, fieldName) {
  return new Promise((resolve, reject) => {
    // H5环境
    if (process.env.UNI_PLATFORM === 'h5') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const formData = new FormData();
            formData.append(fieldName, file);
            
            const record = await pb.collection(collectionName).update(recordId, formData);
            const fileUrl = pb.getFileUrl(record, record[fieldName]);
            resolve(fileUrl);
          } catch (error) {
            reject(error);
          }
        }
      };
      input.click();
    } else {
      // 小程序环境使用 uni.chooseMessageFile
      uni.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['.mp3', '.wav', '.m4a'],
        success: (res) => {
          const tempFilePath = res.tempFiles[0].path;
          
          uni.uploadFile({
            url: `${pb.baseUrl}/api/collections/${collectionName}/records/${recordId}`,
            filePath: tempFilePath,
            name: fieldName,
            header: {
              'Authorization': pb.authStore.token
            },
            success: (uploadRes) => {
              if (uploadRes.statusCode === 200) {
                const data = JSON.parse(uploadRes.data);
                const fileUrl = pb.getFileUrl(data, data[fieldName]);
                resolve(fileUrl);
              } else {
                reject(new Error('上传失败'));
              }
            },
            fail: (error) => {
              reject(error);
            }
          });
        },
        fail: (error) => {
          reject(error);
        }
      });
    }
  });
}

/**
 * 统一错误处理 (uni-app toast)
 */
export function handleApiError(error, defaultMessage = '操作失败') {
  console.error(error);
  
  let message = defaultMessage;
  if (error.response?.message) {
    message = error.response.message;
  } else if (error.message) {
    message = error.message;
  }
  
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  });
}

/**
 * 导出所有共享服务（从 packages/services）
 * 移动端页面只需要 import from '@/api'
 */
export * from 'packages/services/src/api/word.service';
export * from 'packages/services/src/api/user.service';
export * from 'packages/services/src/api/pronunciation.service';
export * from 'packages/services/src/api/article.service';
export * from 'packages/services/src/api/quiz.service';
export * from 'packages/services/src/api/website.service';
export * from 'packages/services/src/api/dialect.service';
export * from 'packages/services/src/pocketbase-client';
export * from 'packages/services/types/pocketbase';
