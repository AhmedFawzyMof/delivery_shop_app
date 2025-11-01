<script setup lang="ts">
import { RouterView } from "vue-router";
import { Toaster } from "@/components/ui/sonner";
import "vue-sonner/style.css";
import { onMounted, onBeforeUnmount } from "vue";
import { App } from "@capacitor/app";
import { useRouter } from "vue-router";

const router = useRouter();

onMounted(() => {
  const handler = App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      router.back();
    } else {
      App.exitApp();
    }
  });

  onBeforeUnmount(async () => {
    (await handler).remove();
  });
});
</script>

<template>
  <Toaster :rich-colors="true" />
  <RouterView />
</template>

<style scoped></style>
