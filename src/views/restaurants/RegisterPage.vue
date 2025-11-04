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
import Textarea from "@/components/ui/textarea/Textarea.vue";

const router = useRouter();
const authStore = useAuthStore();
const baseUrl = "http://192.168.1.8:3000";
const loading = ref(false);

const cities = ref<{ city_id: number; city_name: string }[]>([]);

const formData = ref({
  restaurant_name: "",
  city: "",
  address: "",
  commercial_register: "",
  logo: null as File | null,
  logo_base64: "",
});

const logoPhotoPreview = ref<string | null>(null);

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    formData.value.logo = file;

    try {
      const base64 = await fileToBase64(file);
      formData.value.logo_base64 = base64;
      logoPhotoPreview.value = URL.createObjectURL(
        new Blob([base64.replace(/^data:image\/\w+;base64,/, "")], {
          type: "image/jpeg",
        })
      );
    } catch (error) {
      console.error("Base64 conversion error:", error);
      toast.error("فشل في قراءة الصورة");
    }
  } else {
    formData.value.logo = null;
    formData.value.logo_base64 = "";
    logoPhotoPreview.value = null;
  }
}

async function handleRegister() {
  loading.value = true;
  try {
    const payload = {
      restaurant_name: formData.value.restaurant_name,
      city: formData.value.city,
      address: formData.value.address,
      commercial_register: formData.value.commercial_register,
      logo: formData.value.logo_base64,
    };

    const resp = await CapacitorHttp.post({
      url: `${baseUrl}/api/restaurants/register`,
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
  router.push("/restaurant");
}

onMounted(async () => {
  await authStore.checkRestaurantSession();
  await authStore.checkSession();
  if (authStore.isAuthenticated) {
    if (authStore.type === "driver") {
      router.push("/driver-panel");
    } else if (authStore.type === "restaurant") {
      router.push("/restaurant/dashboard");
    }
  }
  fetchCities();
});

watch(
  () => formData.value.logo,
  (file, oldFile) => {
    if (logoPhotoPreview.value && oldFile) {
      URL.revokeObjectURL(logoPhotoPreview.value);
    }
  }
);
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
            <Label for="restaurant_name">اسم المطعم</Label>
            <Input
              id="restaurant_name"
              type="text"
              placeholder="أحمد فوزي سيد مفتاح"
              v-model="formData.restaurant_name"
              required
            />
          </div>
          <div class="grid gap-2">
            <Label for="address">العنوان</Label>
            <Textarea
              id="address"
              placeholder=" اكتب عنوان المطعم"
              v-model="formData.address"
              required
              class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
          <div class="grid gap-2">
            <Label for="commercial_register">رقم السجل التجاري</Label>
            <Input
              id="commercial_register"
              type="text"
              placeholder="123456789"
              v-model="formData.commercial_register"
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
            <Label for="logo_image">صورة الشعار </Label>
            <Input
              id="logo_image"
              type="file"
              accept="image/*"
              @change="handleFileUpload"
              required
            />
            <div v-if="logoPhotoPreview" class="mt-2">
              <img
                :src="logoPhotoPreview"
                alt="معاينة صورة الرخصة"
                class="max-w-full h-auto rounded-md"
              />
            </div>
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
