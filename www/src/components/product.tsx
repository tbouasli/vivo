"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Trash2 } from "lucide-react";

interface ProductProps {
  product: {
    id: number;
    name: string;
    description: string;
  };
}

export function Product({ product }: ProductProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getProducts = useQuery({
    queryKey: ["products"],
    enabled: false,
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
    onMutate: async (productId) => {
      const previousProducts = queryClient.getQueryData<{
        products: { id: number; name: string; description: string }[];
      }>(["products"]);

      queryClient.setQueryData(["products"], {
        products: previousProducts!.products.filter(
          (product) => product.id !== productId
        ),
      });

      return { previousProducts };
    },
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["products"],
        });
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Erro ao remover produto",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });

      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
    },
  });

  return (
    <li
      key={product.id}
      className="flex justify-between items-center bg-gray-50 p-4 rounded-md"
    >
      <div>
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-sm text-gray-500">{product.description}</p>
      </div>
      <Button
        disabled={getProducts.isLoading}
        variant="destructive"
        size="sm"
        onClick={() => removeProduct.mutate(product.id)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {removeProduct.isPending ? (
          <LoaderCircle className="h-4 w-4 animate-spin mx-auto" />
        ) : (
          "Remover"
        )}
      </Button>
    </li>
  );
}
