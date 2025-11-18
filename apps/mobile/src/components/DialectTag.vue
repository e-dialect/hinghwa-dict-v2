<template>
  <view class="dialect-tag">
    <text class="tag-text">{{ displayName }}</text>
  </view>
</template>

<script>
export default {
  name: 'DialectTag',
  props: {
    dialect: {
      type: Object,
      required: true
    },
    showRegion: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    displayName() {
      if (!this.dialect) return '';
      
      if (this.showRegion && this.dialect.region) {
        return `${this.dialect.name} (${this.dialect.region})`;
      }
      return this.dialect.name;
    }
  }
};
</script>

<style scoped>
.dialect-tag {
  display: inline-block;
  padding: 4rpx 12rpx;
  background-color: #e3f2fd;
  border-radius: 4rpx;
  margin-right: 10rpx;
}

.tag-text {
  font-size: 24rpx;
  color: #1976d2;
}
</style>
