<script setup lang="ts">
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader, Plus } from "lucide-vue-next";
import { ref, watch } from "vue";
import { toast } from "vue-sonner";
import { httpRequest } from "@/utils/http";

const isCreateOrderOpen = ref(false);
const receiptImage = ref<File | null>(null);
const receiptPreview = ref<string | null>(null);
const loading = ref(false);
const newOrder = ref({
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  totalAmount: 0,
  notes: "",
  deliveryCost: 0,
});

const searchTimeout = ref<number | null>(null);
const searchLoading = ref(false);
const foundUsers = ref<any[]>([]);
const showDropdown = ref(false);
const phoneInputRef = ref<HTMLElement | null>(null);

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const handleReceiptUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    receiptImage.value = file;
    receiptPreview.value = URL.createObjectURL(file);
  }
};

const handleCreateOrder = async () => {
  loading.value = true;

  let base64Image: string | null = null;
  if (receiptImage.value) {
    base64Image = await fileToBase64(receiptImage.value);
  }

  const payload = {
    customerName: newOrder.value.customerName,
    customerPhone: newOrder.value.customerPhone,
    customerAddress: newOrder.value.customerAddress,
    totalAmount: newOrder.value.totalAmount,
    notes: newOrder.value.notes,
    deliveryCost: newOrder.value.deliveryCost,
    receiptImage: base64Image,
  };

  try {
    await httpRequest({
      url: "/api/orders",
      method: "POST",
      data: payload,
    });
    toast.success("تم إنشاء الطلب بنجاح");

    newOrder.value = {
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      totalAmount: 0,
      notes: "",
      deliveryCost: 0,
    };
    receiptImage.value = null;
    receiptPreview.value = null;
  } catch (err: any) {
    toast.error(err.message || "فشل في إنشاء الطلب");
  } finally {
    loading.value = false;
  }

  isCreateOrderOpen.value = false;
};

const applyUserData = (user: any) => {
  newOrder.value.customerName = user.user_name;
  newOrder.value.customerAddress = user.user_address;
  newOrder.value.customerPhone = user.user_phone;
  showDropdown.value = false;
};

watch(
  () => newOrder.value.customerPhone,
  (phone) => {
    if (searchTimeout.value) clearTimeout(searchTimeout.value);

    if (!phone || phone.length < 5) {
      foundUsers.value = [];
      showDropdown.value = false;
      return;
    }

    searchTimeout.value = window.setTimeout(async () => {
      try {
        searchLoading.value = true;
        showDropdown.value = true;
        const res = await httpRequest<any>({
          url: `/api/users?search=${phone}&page=1`,
          method: "GET",
        });

        foundUsers.value = res.users || [];
        console.log(foundUsers.value);
        showDropdown.value = true;
      } catch (err) {
        console.error("Search error:", err);
        foundUsers.value = [];
        showDropdown.value = false;
      } finally {
        searchLoading.value = false;
      }
    }, 400);
  }
);

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (phoneInputRef.value && !phoneInputRef.value.contains(target)) {
    showDropdown.value = false;
  }
};

watch(isCreateOrderOpen, (isOpen) => {
  if (isOpen) {
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);
  } else {
    document.removeEventListener("click", handleClickOutside);
  }
});
</script>

<template>
  <Dialog v-model:open="isCreateOrderOpen">
    <DialogTrigger as-child>
      <Button class="bg-primary hover:bg-primary/90">
        <Plus class="h-4 w-4 mr-2" />
        إنشاء طلب
      </Button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>إضافة طلب جديد</DialogTitle>
        <DialogDescription>ضيف طلب جديد لتوصيل أو استلام</DialogDescription>
      </DialogHeader>

      <div dir="rtl" class="grid gap-4 py-4 relative">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="customerName">اسم العميل</Label>
            <Input
              id="customerName"
              v-model="newOrder.customerName"
              placeholder="اكتب اسم العميل"
            />
          </div>

          <div class="space-y-2 relative">
            <Label for="customerPhone">رقم التليفون</Label>
            <Input
              id="customerPhone"
              v-model="newOrder.customerPhone"
              placeholder="+201212158465"
              @focus="showDropdown = foundUsers.length > 0"
            />

            <div
              v-if="showDropdown || searchLoading"
              class="absolute w-full mt-1 p-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
            >
              <div
                v-if="searchLoading"
                class="text-sm text-gray-500 dark:text-gray-400 p-2"
              >
                جاري البحث...
              </div>
              <div
                v-else-if="foundUsers.length === 0"
                class="text-sm text-gray-500 dark:text-gray-400 p-2"
              >
                لا يوجد نتائج
              </div>
              <div v-else class="max-h-48 overflow-y-auto">
                <div
                  v-for="user in foundUsers"
                  :key="user.id"
                  @click="applyUserData(user)"
                  class="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-md transition"
                >
                  <div class="font-medium text-xs text-white">
                    اسم العميل: {{ user.user_name }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    رقم التليفون: {{ user.user_phone }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="customerAddress">عنوان التوصيل</Label>
          <Textarea
            id="customerAddress"
            v-model="newOrder.customerAddress"
            placeholder="اكتب العنوان بالكامل"
            rows="2"
          />
        </div>

        <div class="space-y-2">
          <Label for="receiptImage">صورة الفاتورة (اختياري)</Label>
          <Input
            id="receiptImage"
            type="file"
            accept="image/*"
            @change="handleReceiptUpload"
          />
          <div v-if="receiptPreview" class="mt-3">
            <p class="text-sm text-muted-foreground mb-2">معاينة الصورة:</p>
            <img
              :src="receiptPreview"
              alt="Receipt Preview"
              class="rounded-md border w-full h-48 object-cover"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="totalAmount">إجمالي السعر (ج.م)</Label>
            <Input
              id="totalAmount"
              type="number"
              v-model="newOrder.totalAmount"
              placeholder="0.00"
            />
          </div>
          <div class="space-y-2">
            <Label for="notes">ملاحظات (اختياري)</Label>
            <Input
              id="notes"
              v-model="newOrder.notes"
              placeholder="تعليمات خاصة"
            />
          </div>
        </div>

        <div class="flex flex-col space-y-2">
          <Label for="deliveryCost">تكلفة التوصيل</Label>
          <Input
            v-model="newOrder.deliveryCost"
            id="deliveryCost"
            type="number"
            placeholder="0.00"
          />
        </div>

        <div class="flex space-x-2">
          <Button @click="newOrder.deliveryCost += 5">+5 ج.م</Button>
          <Button @click="newOrder.deliveryCost += 10">+10 ج.م</Button>
          <Button @click="newOrder.deliveryCost += 15">+15 ج.م</Button>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="isCreateOrderOpen = false"
          >إلغاء</Button
        >
        <Button
          class="bg-primary hover:bg-primary/90"
          @click="handleCreateOrder"
          :disabled="
            !newOrder.customerName ||
            !newOrder.customerPhone ||
            !newOrder.customerAddress ||
            !newOrder.totalAmount ||
            !newOrder.deliveryCost ||
            loading
          "
        >
          <Loader v-if="loading" class="animate-spin" />
          <span v-else>إنشاء الطلب</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
