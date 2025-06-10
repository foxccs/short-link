<template>
  <div class="advanced-options" :class="{ authenticated: isAuthenticated }">
    <div class="toggle" @click="toggleAdvancedOptions">
      <div class="toggle-content">
        <span class="toggle-icon">
          <Settings size="18" />
        </span>
        <span>高级选项</span>
      </div>
      <span class="arrow" :class="{ 'arrow-down': showAdvancedOptions }">
        <ChevronDown size="16" />
      </span>
    </div>

    <transition name="slide">
      <div class="options" v-if="showAdvancedOptions">
        <!-- 过期时间选项 -->
        <div class="option-group">
          <label style="display: flex">
            <span class="option-icon">
              <Clock size="16" />
            </span>
            链接有效期
          </label>
          <div class="radio-group">
            <div
              v-for="option in expirationOptions"
              :key="option.id"
              class="radio-item"
              :class="{ active: selectedExpiration === option.id }"
              @click="handleExpirationChange(option.id)"
            >
              <div class="radio-circle"></div>
              <div class="radio-text">
                <span>{{ option.name }}</span>
                <span v-if="option.is_permanent" class="badge">推荐</span>
              </div>
            </div>
          </div>

          <!-- 自定义天数输入 -->
          <div v-if="selectedExpiration === 6" class="custom-days">
            <input
              type="number"
              :value="customDays"
              @input="emit('update:customDays', $event.target.value)"
              min="1"
              max="365"
              placeholder="天数"
            />
            <span>天</span>
          </div>
        </div>

        <!-- 链接可见性选项 (仅登录用户可见) -->
        <div v-if="isUserAuthenticated" class="option-group">
          <label>
            <span class="option-icon">
              <Eye size="16" />
            </span>
            链接可见性
          </label>
          <div class="visibility-group">
            <div
              class="radio-item"
              :class="{ active: visibility === 'public' }"
              @click="emit('update:visibility', 'public')"
              title="所有人都可以访问此链接"
            >
              <div class="radio-circle"></div>
              <div class="radio-text">
                <span>公开</span>
                <span class="badge">所有人可访问</span>
              </div>
            </div>
            <div
              class="radio-item"
              :class="{ active: visibility === 'private' }"
              @click="emit('update:visibility', 'private')"
              title="仅创建者可以访问此链接"
            >
              <div class="radio-circle"></div>
              <div class="radio-text">
                <span>私有</span>
                <span class="badge">仅创建者可访问</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!isUserAuthenticated" class="login-prompt">
          <div class="login-prompt-content">
            <span class="login-prompt-icon">
              <User size="16" />
            </span>
            <span>登录后可使用高级选项，包括自定义有效期和私有链接</span>
            <button class="login-prompt-button" @click="$emit('login')">
              立即登录
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ChevronDown, Clock, Eye, Settings, User } from 'lucide-vue-next';

const props = defineProps({
  expirationOptions: {
    type: Array,
    default: () => []
  },
  selectedExpiration: {
    type: [Number, String],
    default: null
  },
  customDays: {
    type: [Number, String],
    default: 7
  },
  visibility: {
    type: String,
    default: 'private'
  },
  isAuthenticated: {
    type: Boolean,
    default: false
  },
  showAdvancedOptions: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'update:selectedExpiration',
  'update:customDays',
  'update:visibility',
  'update:showAdvancedOptions',
  'expirationChange',
  'login'
]);

// 计算属性
const isUserAuthenticated = computed(() => props.isAuthenticated);

// 切换高级选项显示
function toggleAdvancedOptions() {
  emit('update:showAdvancedOptions', !props.showAdvancedOptions);
}

// 处理有效期选择变化
function handleExpirationChange(value) {
  emit('update:selectedExpiration', value);
  emit('expirationChange', value);
}
</script>

<style scoped>
.advanced-options {
  margin-top: 24px;
  text-align: left;
}

.toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background-color: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
  margin-bottom: 0;
}

.toggle:hover {
  background-color: #f1f3f5;
  border-color: #d0d0d0;
}

.toggle-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c5ce7;
}

.arrow {
  transition: transform 0.3s ease;
  color: #6c5ce7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-down {
  transform: rotate(180deg);
}

.options {
  margin-top: 16px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
  opacity: 1;
  margin-top: 16px;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
  border-width: 0;
}

.option-group {
  margin-bottom: 24px;
  position: relative;
}

.option-group:last-child {
  margin-bottom: 0;
}

.option-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #2d3436;
  font-size: 15px;
}

.option-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c5ce7;
}

.visibility-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login-prompt {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #e0e0e0;
}

.login-prompt-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background-color: rgba(108, 92, 231, 0.08);
  border-radius: 10px;
  color: #6c5ce7;
  font-size: 14px;
}

.login-prompt-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-prompt-button {
  margin-left: auto;
  padding: 8px 16px;
  background-color: #6c5ce7;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-prompt-button:hover {
  background-color: #5a4ad1;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(108, 92, 231, 0.2);
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.radio-item {
  padding: 10px 16px;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}

.radio-item:hover {
  border-color: #6c5ce7;
  background-color: rgba(108, 92, 231, 0.05);
}

.radio-item.active {
  background-color: rgba(108, 92, 231, 0.1);
  border-color: #6c5ce7;
}

.radio-item.active .radio-circle {
  border-color: #6c5ce7;
}

.radio-item.active .radio-circle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background-color: #6c5ce7;
  border-radius: 50%;
}

.radio-circle {
  width: 18px;
  height: 18px;
  border: 2px solid #ccc;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.radio-text {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge {
  font-size: 12px;
  padding: 2px 8px;
  background-color: rgba(108, 92, 231, 0.1);
  color: #6c5ce7;
  border-radius: 12px;
  margin-left: 8px;
}

.custom-days {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-days input {
  width: 80px;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.custom-days input:focus {
  outline: none;
  border-color: #6c5ce7;
  box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1);
}

@media screen and (max-width: 768px) {
  .radio-group {
    flex-direction: column;
    gap: 8px;
  }

  .radio-item {
    width: 100%;
  }
}

@media screen and (max-width: 520px) {
  .radio-group {
    flex-direction: column;
    width: 100%;
  }

  .radio-item {
    width: 100%;
  }
}
</style>