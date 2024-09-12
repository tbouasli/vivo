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
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo } from "react";

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
  const [value, setValue] = React.useState<string | null>(null);

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
    onSuccess: () => {
      setTimeout(() => {
        products.refetch();
      }, 1000);
    },
  });

  const removeProduct = useMutation({
    mutationKey: ["remove-products"],
    mutationFn: async (productId: number) => {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/my-products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
    },
    onSuccess: () => {
      setTimeout(() => {
        products.refetch();
      }, 1000);
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
                      {products.data!.products.map((product) => (
                        <li
                          key={product.id}
                          className="flex justify-between items-center bg-gray-50 p-4 rounded-md"
                        >
                          <div>
                            <h3 className="text-lg font-semibold">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {product.description}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeProduct.mutate(product.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </li>
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
