<template>
  <view
    class="pronunciation-btn"
    @tap="handlePlay"
  >
    <text
      class="cuIcon-sound"
      :class="{ 'text-blue': !isPlaying, 'text-green': isPlaying }"
    />
  </view>
</template>

<script>
import { playPronunciation } from '@/api';

export default {
  name: 'PronunciationButton',
  props: {
    pronunciation: {
      type: Object,
      default: null
    },
    ipa: {
      type: String,
      default: ''
    },
    pinyin: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isPlaying: false
    };
  },
  methods: {
    async handlePlay() {
      if (this.isPlaying) return;
      
      this.isPlaying = true;
      
      try {
        if (this.pronunciation) {
          // Play existing pronunciation with audio file
          await playPronunciation(this.pronunciation);
        } else if (this.pinyin) {
          // Synthesize from pinyin
          await playPronunciation({ pinyin: this.pinyin });
        } else if (this.ipa) {
          // Synthesize from IPA
          await playPronunciation({ ipa: this.ipa });
        }
      } catch (error) {
        console.error('播放发音失败:', error);
        uni.showToast({
          title: '播放失败',
          icon: 'none'
        });
      } finally {
        setTimeout(() => {
          this.isPlaying = false;
        }, 1000);
      }
    }
  }
};
</script>

<style scoped>
.pronunciation-btn {
  display: inline-block;
  padding: 5rpx 15rpx;
  cursor: pointer;
}

.cuIcon-sound {
  font-size: 40rpx;
}
</style>
