<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import Header from "@/components/Header.vue";
import CustomPagination from "@/components/CustomPagination.vue";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, User } from "lucide-vue-next";
import { toast } from "vue-sonner";
import { httpRequest } from "@/utils/http";

interface User {
  user_id: number;
  user_name: string;
  user_phone: string;
  user_email?: string;
  created_at: string;
}

const users = ref<User[]>([]);
const loading = ref(false);
const error = ref("");

const currentPage = ref(1);
const itemsPerPage = ref(50);
const totalPages = ref(1);
const totalItems = ref(0);

const search = ref("");

const fetchUsers = async () => {
  loading.value = true;

  try {
    const res = await httpRequest<{ users: User[]; totalItems: number }>({
      url: `/users?page=${currentPage.value}&search=${search.value || ""}`,
      method: "GET",
    });
    users.value = res.users || [];
    totalItems.value = res.totalItems || 0;
    totalPages.value = Math.ceil(totalItems.value / itemsPerPage.value);
  } catch (err: any) {
    error.value = err.message || "فشل في جلب المستخدمين";
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
};

watch(currentPage, async (newPage, oldPage) => {
  if (newPage !== oldPage) await fetchUsers();
});

const handleSearch = async () => {
  currentPage.value = 1;
  await fetchUsers();
};

onMounted(fetchUsers);
</script>

<template>
  <Header />

  <div class="p-6 space-y-8" dir="rtl">
    <Card>
      <CardHeader>
        <CardTitle>قائمة المستخدمين</CardTitle>
        <CardDescription>استعرض جميع المستخدمين في النظام</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex flex-col md:flex-row gap-4 items-end mb-6">
          <div class="flex flex-col flex-1">
            <label class="text-sm font-medium mb-1">بحث بالاسم أو الهاتف</label>
            <Input
              v-model="search"
              placeholder="اكتب اسم المستخدم أو رقم الهاتف"
            />
          </div>
          <Button @click="handleSearch" :disabled="loading">
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            بحث
          </Button>
        </div>

        <div v-if="!loading && users.length > 0" class="space-y-4">
          <div
            v-for="user in users"
            :key="user.user_id"
            class="border border-border rounded-lg p-4 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <User class="h-6 w-6 text-primary" />
              <div>
                <p class="font-medium">{{ user.user_name }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ user.user_phone }}
                </p>
                <p v-if="user.user_email" class="text-xs text-muted-foreground">
                  {{ user.user_email }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!loading && users.length === 0" class="text-center py-8">
          <User class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p class="text-muted-foreground">مافيش مستخدمين حاليا</p>
        </div>

        <div v-if="loading" class="flex justify-center py-8">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>

        <CustomPagination
          v-if="!loading && totalItems > itemsPerPage"
          :current-page="currentPage"
          :total-items="totalItems"
          :items-per-page="itemsPerPage"
          @update:current-page="currentPage = $event"
        />
      </CardContent>
    </Card>
  </div>
</template>
