<script setup lang="ts">
import { useDriverTracker } from "@/composables/useDriverTraker";
import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff } from "lucide-vue-next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderHistory from "@/components/OrderHistory.vue";
import DriverTab from "@/components/DriverTab.vue";
import { useOrdersStore } from "@/stores/orders";

const { isOnline, goOnline, goOffline } = useDriverTracker();
const authStore = useAuthStore();
const ordersStore = useOrdersStore();
const router = useRouter();
const orders = computed(() => ordersStore.orders);
const activeTab = ref("current-orders");

onMounted(async () => {
  await authStore.checkSession();
  if (!authStore.isAuthenticated) {
    authStore.logout();
    router.push("/");
  }
});
</script>

<template>
  <header
    dir="rtl"
    class="flex items-center justify-between px-4 py-3 shadow-md"
  >
    <div class="details flex items-center gap-2">
      <div class="avatar w-12 h-12 bg-primary rounded-full relative">
        <p
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-2xl text-white"
        >
          {{ authStore.driver?.driver_full_name.split("")[0] }}
        </p>
      </div>
      <div>
        <p class="font-bold">
          {{ authStore.driver?.driver_full_name.split(" ")[0] }}
        </p>
        <p class="text-xs text-gray-400">Driver Dashboard</p>
      </div>
    </div>

    <Button
      :disabled="orders.length > 0"
      @click="isOnline ? goOffline() : goOnline()"
      class="flex items-center gap-2 relative bg-primary rounded shadow w-10 h-10"
    >
      <span class="text-white">
        <Wifi v-if="isOnline" class="" />
        <WifiOff v-else />
      </span>
    </Button>
  </header>
  <Tabs
    v-model="activeTab"
    dir="rtl"
    default-value="current-orders"
    class="w-full"
  >
    <TabsList class="grid w-full grid-cols-2">
      <TabsTrigger value="current-orders">الطلبات الحالية</TabsTrigger>
      <TabsTrigger value="order-history">سجل الطلبات</TabsTrigger>
    </TabsList>
    <TabsContent value="current-orders">
      <DriverTab />
    </TabsContent>
    <TabsContent value="order-history">
      <OrderHistory />
    </TabsContent>
  </Tabs>
</template>
