"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LockIcon, MailIcon } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Component() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const router = useRouter();
  const { toast } = useToast();

  const onSubmit = form.handleSubmit(async (data) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sign-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      form.setError("password", {
        type: "server",
        message: "E-mail ou senha inválidos",
      });

      return;
    }

    const { token } = await response.json();

    if (!token) {
      toast({
        title: "Credenciais inválidas",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("token", token);

    router.push("/app");
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <LockIcon className="mx-auto h-12 w-auto text-primary" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Entrar na sua conta
            </h2>
          </div>
          <Form {...form}>
            <form className="space-y-6 mt-8" onSubmit={onSubmit}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-700">
                      Endereço de e-mail
                    </FormLabel>
                    <FormControl>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MailIcon
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
                        </div>
                        <Input
                          id="email"
                          type="email"
                          autoComplete="email"
                          required
                          className="pl-10 block w-full"
                          placeholder="example@example.com"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-sm font-medium text-gray-700">
                      Senha
                    </FormLabel>
                    <FormControl>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LockIcon
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
                        </div>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          required
                          className="pl-10 block w-full"
                          placeholder="••••••••"
                          {...field}
                        />
                      </div>
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <Button type="submit" className="w-full">
                  Entrar
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/sign-up"
                className="font-medium text-primary hover:text-primary-dark"
              >
                Criar uma nova conta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
