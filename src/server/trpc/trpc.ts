import { Permission } from '@prisma/client';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
            ? fromZodError(error.cause).message
            : error.message
      }
    };
  }
});

export const { router } = t;

/**
 * Unprotected procedure
 * */
export const publicProcedure = t.procedure;

/**
 * Reusable middleware to ensure
 * users are logged in
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user }
    }
  });
});

/**
 * Protected procedure
 * */
export const protectedProcedure = t.procedure.use(isAuthed);

const isModerator = t.middleware(({ ctx, next }) => {
  if (!ctx.session || ctx.session.user.permission === Permission.USER) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user }
    }
  });
});

/**
 * Moderator procedure
 */
export const moderatorProcedure = protectedProcedure.use(isModerator);

/**
 * Reusable middleware to ensure
 * user is an admin
 */
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session || ctx.session.user.permission !== Permission.ADMIN) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user }
    }
  });
});

/**
 * Admin procedure
 */
export const adminProcedure = protectedProcedure.use(isAdmin);
