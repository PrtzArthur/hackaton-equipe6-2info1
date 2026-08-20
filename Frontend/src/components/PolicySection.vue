<script setup>
defineProps({
  title: String,
  content: String,
  items: Array,
  isContact: Boolean
})
</script>

<template>
  <section :class="['policy-section', { 'contact-box': isContact }]">
    <h2 v-if="title">{{ title }}</h2>
    <p v-if="content" v-html="content"></p>
    
    <ul v-if="items && items.length">
      <li v-for="(item, index) in items" :key="index" v-html="item"></li>
    </ul>
  </section>
</template>

<style scoped>
.policy-section h2 {
  font-size: 1rem;
  font-weight: bold;
  margin: 0 0 8px 0;
  color: #000000;
}

.policy-section p {
  font-size: 0.88rem;
  color: #333333;
  line-height: 1.5;
  margin: 0 0 8px 0;
}

.policy-section ul {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.policy-section li {
  font-size: 0.85rem;
  color: #333333;
  line-height: 1.4;
}

.contact-box {
  background-color: #f9f9f9;
  border: 1px dashed #000000;
  padding: 12px;
  border-radius: 6px;
}
</style>