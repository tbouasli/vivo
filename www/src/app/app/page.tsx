"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoaderCircle, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { Product } from "@/components/product";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const allProducts = [
  {
    id: 1,
    name: "VIVO Telefone",
    description: "Plano de telefone fixo da VIVO",
  },
  { id: 2, name: "VIVO Internet", description: "Plano de internet da VIVO" },
  { id: 3, name: "VIVO TV", description: "Plano de TV a cabo da VIVO" },
];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [value, setValue] = React.useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/");
      return;
    }
  }, []);

  const products = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/my-products`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      return response.json() as Promise<{
        products: { id: number; name: string; description: string }[];
      }>;
    },
  });

  const addProduct = useMutation({
    mutationKey: ["add-products"],
    mutationFn: async (productId: string) => {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/my-products/${productId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
    },
    onMutate: async (productId) => {
      const previousProducts = queryClient.getQueryData<{
        products: { id: number; name: string; description: string }[];
      }>(["products"]);

      queryClient.setQueryData(["products"], {
        products: [
          ...previousProducts!.products,
          allProducts.find((p) => p.id === Number(productId))!,
        ],
      });

      setValue(null);

      return { previousProducts };
    },
    onSuccess: () => {
      setTimeout(() => {
        products.refetch();
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar produto",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });

      products.refetch();
    },
  });

  const availableProducts = useMemo(() => {
    return allProducts.filter(
      (product) => !products.data?.products.some((p) => p.id === product.id)
    );
  }, [products.data]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-500">
              Bem vindo, usuário
            </span>
            <Avatar>
              <AvatarImage src="https://api.dicebear.com/9.x/pixel-art/svg" />
              <AvatarFallback>AN</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Seus Produtos</CardTitle>
                  <CardDescription>
                    Produtos associados à sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {products.isLoading ? (
                    <LoaderCircle className="h-8 w-8 animate-spin mx-auto" />
                  ) : products.data!.products.length > 0 ? (
                    <ul className="space-y-4">
                      {addProduct.isPending && (
                        <li className="flex justify-center">
                          <LoaderCircle className="h-8 w-8 animate-spin" />
                        </li>
                      )}
                      {products.data!.products.map((product) => (
                        <Product key={product.id} product={product} />
                      ))}
                    </ul>
                  ) : (
                    <p>Você não possui produtos associados à sua conta</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Produto</CardTitle>
                  <CardDescription>
                    Selecione um produto para adicionar à sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Select onValueChange={setValue}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.map((product) => (
                          <SelectItem
                            key={product.id}
                            value={product.id.toString()}
                          >
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => value && addProduct.mutate(value)}>
                      {addProduct.isPending ? (
                        <LoaderCircle className="h-4 w-4 animate-spin mx-auto" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
