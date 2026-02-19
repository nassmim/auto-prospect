-- Insert creditBalances row for any account that doesn't have one
INSERT INTO credit_balances (id, account_id, sms, ringless_voice, whatsapp_text, updated_at)
SELECT
  gen_random_uuid(),
  a.id,
  0,
  0,
  0,
  now()
FROM accounts a
LEFT JOIN credit_balances cb ON cb.account_id = a.id
WHERE cb.id IS NULL;
--> statement-breakpoint

-- Create function to automatically create credit balance for new accounts
CREATE OR REPLACE FUNCTION create_credit_balance_for_new_account()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO credit_balances (account_id, sms, ringless_voice, whatsapp_text)
  VALUES (NEW.id, 0, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- Create trigger to call function after account insert
CREATE TRIGGER create_credit_balance_after_account_insert
AFTER INSERT ON accounts
FOR EACH ROW
EXECUTE FUNCTION create_credit_balance_for_new_account();
