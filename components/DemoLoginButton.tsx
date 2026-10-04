/**
 * A plain HTML form that signs in as a seeded demo user. Works without
 * JavaScript, so it is safe to use in the server-rendered header.
 */
export function DemoLoginButton({
  userId,
  redirectTo = "/account",
  className,
  children,
}: {
  userId: string;
  redirectTo?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form action="/api/auth/demo-login" method="post" className="contents">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
