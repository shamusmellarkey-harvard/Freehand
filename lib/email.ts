/**
 * Email sending stub. This is the single place to plug in a real provider
 * (for example Resend) later. For now it logs to the server console.
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  console.log("\n========== EMAIL (stub, not actually sent) ==========");
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log("-----------------------------------------------------");
  console.log(body);
  console.log("=====================================================\n");
}
