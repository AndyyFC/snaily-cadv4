import { Formik } from "formik";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { AUTH_SCHEMA } from "@snailycad/schemas";

import useFetch from "lib/useFetch";

import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Input, PasswordInput } from "components/form/Input";
import { Loader } from "components/Loader";
import { handleValidate } from "lib/handleValidate";
import { useTranslations } from "use-intl";
import type { GetServerSideProps } from "next";
import { getTranslations } from "lib/getTranslation";
import { Button } from "components/Button";
import { findUrl, handleRequest } from "lib/fetch";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";

const INITIAL_VALUES = {
  username: "",
  password: "",
};

export default function Login() {
  const router = useRouter();
  const { state, execute } = useFetch();
  const t = useTranslations("Auth");
  const error = useTranslations("Errors");
  const { DISCORD_AUTH } = useFeatureEnabled();

  const authMessages = {
    banned: error("userBanned"),
    deleted: error("userDeleted"),
    discordNameInUse: error("discordNameInUse"),
  } as const;

  const errorMessage = authMessages[router.query.error as keyof typeof authMessages];

  const validate = handleValidate(AUTH_SCHEMA);

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/auth/login", {
      data: values,
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });

    if (json.hasTempPassword) {
      router.push({
        pathname: "/auth/temp-password",
        query: { tp: values.password },
      });
    } else if (json?.userId) {
      router.push("/citizen");
    }
  }

  function handleDiscordLogin() {
    const url = findUrl();

    const fullUrl = `${url}/auth/discord`;
    window.location.href = fullUrl;
  }

  return (
    <>
      <Head>
        <title>Login - SnailyCAD</title>
      </Head>

      <main className="flex justify-center pt-20">
        <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ handleSubmit, handleChange, errors, isValid }) => (
            <form
              className="w-full max-w-md p-6 bg-gray-100 rounded-lg shadow-md dark:bg-gray-2"
              onSubmit={handleSubmit}
            >
              <h1 className="mb-3 text-2xl font-semibold text-gray-800 dark:text-white">
                {t("login")}
              </h1>

              {errorMessage ? (
                <p className="bg-red-500/80 text-black w-full py-1.5 px-3 my-3 rounded-md">
                  {errorMessage}
                </p>
              ) : null}

              <FormField fieldId="username" label={t("username")}>
                <Input
                  hasError={!!errors.username}
                  id="username"
                  type="text"
                  name="username"
                  onChange={handleChange}
                />
                <Error>{errors.username}</Error>
              </FormField>

              <FormField fieldId="password" label={t("password")}>
                <PasswordInput
                  hasError={!!errors.password}
                  id="password"
                  name="password"
                  onChange={handleChange}
                />
                <Error>{errors.password}</Error>
              </FormField>

              <div className="mt-3">
                <Link href="/auth/register">
                  <a className="inline-block mb-3 underline dark:text-gray-200">{t("noAccount")}</a>
                </Link>

                <Button
                  disabled={!isValid || state === "loading"}
                  type="submit"
                  className="flex items-center justify-center w-full gap-3"
                >
                  {state === "loading" ? <Loader /> : null} {t("login")}
                </Button>
              </div>

              {DISCORD_AUTH ? (
                <>
                  <hr className="my-5 border-[1.5px] rounded-md border-gray-3" />

                  <Button type="button" onClick={handleDiscordLogin} className="w-full">
                    Login via Discord
                  </Button>
                </>
              ) : null}
            </form>
          )}
        </Formik>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const { data } = await handleRequest("/admin/manage/cad-settings").catch(() => ({
    data: null,
  }));

  return {
    props: {
      cad: data ?? {},
      messages: await getTranslations(["auth"], locale),
    },
  };
};
