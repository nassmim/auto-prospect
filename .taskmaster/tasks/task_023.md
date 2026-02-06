# Task ID: 23

**Title:** Refactor Template Forms with react-hook-form and Zod

**Status:** done

**Dependencies:** 17 ✓, 19 ✓

**Priority:** high

**Description:** Refactor TextTemplateForm and VoiceTemplateForm components to use react-hook-form with Zod validation and shadcn/ui components.

**Details:**

Refactor `src/components/templates/text-template-form.tsx`:

1. Replace useState with useForm:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { textTemplateSchema, type TextTemplateFormData } from '@/schemas/validation/template.validation';

const form = useForm<TextTemplateFormData>({
  resolver: zodResolver(textTemplateSchema),
  defaultValues: {
    name: '',
    channel: 'whatsapp',
    content: '',
    isDefault: false,
  },
});
```

2. Handle variable insertion with form state:
```typescript
const handleInsertVariable = (variable: string) => {
  const currentContent = form.getValues('content');
  // Insert at cursor position logic...
  form.setValue('content', newContent, { shouldValidate: true });
};
```

3. Use shadcn Select for channel dropdown:
```typescript
<FormField
  control={form.control}
  name="channel"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Canal</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un canal" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="whatsapp">WhatsApp</SelectItem>
          <SelectItem value="sms">SMS</SelectItem>
          <SelectItem value="leboncoin">Leboncoin</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

Refactor `src/components/templates/voice-template-form.tsx`:

1. Use voiceTemplateClientSchema for client validation
2. Handle Blob validation specially since it can't be in react-hook-form directly:
```typescript
const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
// Validate blob separately before submit
```

3. Maintain audio preview functionality while using form state

**Test Strategy:**

1. Test text template form validation errors display correctly
2. Test channel selection works with shadcn Select
3. Test variable insertion still works with form state
4. Test live preview updates correctly
5. Test voice template duration validation (15-55s)
6. Test voice template requires audio file before submit
7. Test both forms submit successfully with valid data
8. Verify isDefault checkbox works correctly
