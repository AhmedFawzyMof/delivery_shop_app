<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { toast } from "vue-sonner";
import { useRouter } from "vue-router";
import { CapacitorHttp } from "@capacitor/core";
import { useAuthStore } from "@/stores/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
} from "@/components/ui/select";
import { Loader } from "lucide-vue-next";
import baseUrl from "@/utils/baseUrl";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);

const cities = ref<{ city_id: number; city_name: string }[]>([]);

const formData = ref({
  full_name: "",
  phone: "",
  city: "",
  type: "",
  id_number: "",
  plate_number: "",
});

async function fetchCities() {
  try {
    const resp = await CapacitorHttp.get({
      url: `${baseUrl}/api/cities`,
      webFetchExtra: { credentials: "include" },
    });
    cities.value = resp.data;
  } catch (err: any) {
    console.error("fetchCities error:", err);
    toast.error("فشل تحميل المدن");
  }
}

async function handleRegister() {
  loading.value = true;
  try {
    const payload = {
      full_name: formData.value.full_name,
      phone: formData.value.phone,
      city: formData.value.city,
      type: formData.value.type,
      id_number: formData.value.id_number,
      plate_number: formData.value.plate_number,
    };

    const resp = await CapacitorHttp.post({
      url: `${baseUrl}/api/driver/register`,
      data: payload,
      headers: { "Content-Type": "application/json" },
    });

    if (resp.status < 200 || resp.status >= 300) {
      throw new Error("خطأ في إرسال بيانات التسجيل");
    }

    toast.success("تم تسجيل حسابك بنجاح!");
    router.push("/");
  } catch (err: any) {
    console.error("handleRegister error:", err);
    toast.error(err.message || "فشل تسجيل الحساب.");
  } finally {
    loading.value = false;
  }
}

function goToLogin() {
  router.push("/login");
}

onMounted(async () => {
  await authStore.checkSession();
  await authStore.checkRestaurantSession();
  if (authStore.isAuthenticated) {
    if (authStore.type === "driver") {
      router.push("/driver-panel");
    } else if (authStore.type === "restaurant") {
      router.push("/restaurant/dashboard");
    }
  }
  fetchCities();
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">تسجيل حساب</CardTitle>
        <CardDescription
          >اعمل حساب جديد علشان تبدأ تستخدم التطبيق</CardDescription
        >
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="grid gap-2">
            <Label for="full_name">الاسم بالكامل</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="أحمد فوزي سيد مفتاح"
              v-model="formData.full_name"
              required
            />
          </div>
          <div class="grid gap-2">
            <Label for="phone">رقم الموبايل</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="01212158465"
              v-model="formData.phone"
              required
            />
          </div>
          <div class="grid gap-2">
            <Label for="city">المدينة</Label>
            <Select v-model="formData.city" required>
              <SelectTrigger class="w-full">
                <SelectValue placeholder="اختر المدينة" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel class="text-gray-400">المدينة</SelectLabel>
                  <SelectItem
                    v-for="city in cities"
                    :key="city.city_id"
                    :value="city.city_name"
                  >
                    {{ city.city_name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label for="type">النوع وسيلة النقل</Label>
            <Select v-model="formData.type" required>
              <SelectTrigger class="w-full">
                <SelectValue placeholder="اختر نوعك" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel class="text-gray-400">وسيلة نقل</SelectLabel>
                  <SelectItem value="موتوسيكل">موتوسيكل</SelectItem>
                  <SelectItem value="عجلة">عجلة</SelectItem>
                  <SelectItem value="سيارة">سيارة</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label for="id_number">رقم البطاقة</Label>
            <Input
              id="id_number"
              type="text"
              placeholder="123456789"
              v-model="formData.id_number"
              required
            />
          </div>
          <div class="grid gap-2">
            <Label for="plate_number">رقم العربية</Label>
            <Input
              id="plate_number"
              type="text"
              placeholder="س ر ط - 123"
              v-model="formData.plate_number"
              required
            />
          </div>

          <Button type="submit" class="w-full" :disabled="loading">
            <Loader v-if="loading" class="w-4 h-4 animate-spin" />
            <span v-else="loading"> تسجيل </span>
          </Button>
        </form>
        <div class="mt-4 text-center text-sm">
          عندك حساب قبل كده؟
          <Button variant="link" @click="goToLogin" class="p-0 h-auto">
            سجل دخول
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
