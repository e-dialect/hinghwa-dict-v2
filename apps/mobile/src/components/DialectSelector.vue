<template>
  <view class="dialect-selector">
    <picker
      :value="selectedIndex"
      :range="dialectOptions"
      range-key="name"
      @change="handleChange"
    >
      <view class="picker-display">
        <text class="dialect-label">方言：</text>
        <text class="dialect-value">{{ currentDialect }}</text>
        <text class="cuIcon-unfold" />
      </view>
    </picker>
  </view>
</template>

<script>
import { getAllDialects, getUserPreferredDialect, setUserPreferredDialect } from '@/api';

export default {
  name: 'DialectSelector',
  props: {
    value: {
      type: String,
      default: ''
    },
    showLabel: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      dialectOptions: [],
      selectedIndex: 0
    };
  },
  computed: {
    currentDialect() {
      if (this.dialectOptions.length > 0 && this.selectedIndex >= 0) {
        return this.dialectOptions[this.selectedIndex].name;
      }
      return '加载中...';
    }
  },
  mounted() {
    this.loadDialects();
  },
  methods: {
    async loadDialects() {
      try {
        const dialects = await getAllDialects();
        this.dialectOptions = dialects;
        
        // Load user preferred dialect
        const userInfo = uni.getStorageSync('userInfo');
        if (userInfo && userInfo.id) {
          const preferred = await getUserPreferredDialect(userInfo.id);
          if (preferred) {
            const index = dialects.findIndex(d => d.id === preferred.id);
            if (index >= 0) {
              this.selectedIndex = index;
            }
          }
        } else if (this.value) {
          // Use prop value
          const index = dialects.findIndex(d => d.id === this.value);
          if (index >= 0) {
            this.selectedIndex = index;
          }
        }
      } catch (error) {
        console.error('加载方言失败:', error);
      }
    },
    async handleChange(e) {
      const index = e.detail.value;
      this.selectedIndex = index;
      const selected = this.dialectOptions[index];
      
      // Emit change event
      this.$emit('input', selected.id);
      this.$emit('change', selected);
      
      // Save user preference if logged in
      const userInfo = uni.getStorageSync('userInfo');
      if (userInfo && userInfo.id) {
        try {
          await setUserPreferredDialect(userInfo.id, selected.id);
        } catch (error) {
          console.error('保存方言偏好失败:', error);
        }
      }
    }
  }
};
</script>

<style scoped>
.dialect-selector {
  display: inline-block;
}

.picker-display {
  display: flex;
  align-items: center;
  padding: 10rpx 20rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
}

.dialect-label {
  color: #666;
  margin-right: 10rpx;
}

.dialect-value {
  color: #333;
  font-weight: bold;
  margin-right: 10rpx;
}

.cuIcon-unfold {
  color: #999;
}
</style>
