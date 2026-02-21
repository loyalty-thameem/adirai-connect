import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  mobile: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

export function LoginCard() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { mobile: '' },
  });

  const onSubmit = (data: FormData) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      return;
    }
    // eslint-disable-next-line no-console
    console.log('OTP request payload', result.data);
  };

  return (
    <form className="card" onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="mobile">Mobile Number</label>
      <input id="mobile" placeholder="Enter mobile" {...register('mobile', { required: true })} />
      {errors.mobile ? <p className="error">Mobile is required</p> : null}
      <button type="submit">Request OTP</button>
    </form>
  );
}

