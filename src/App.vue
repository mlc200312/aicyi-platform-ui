<template>
  <ErrorBanner />
  <GlobalLoading />
  <router-view />
</template>

<script setup lang="ts">
import ErrorBanner from '@/components/ErrorBanner.vue'
import GlobalLoading from '@/components/GlobalLoading.vue'
</script>
