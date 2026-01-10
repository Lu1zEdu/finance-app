import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar']
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0].value;

            let user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        googleId: profile.id,
                        email: email!,
                        firstName: profile.name?.givenName || 'Usuário',
                        lastName: profile.name?.familyName || '',
                        avatarUrl: profile.photos?.[0].value,
                        accounts: { create: [{ name: 'Conta Principal' }, { name: 'Dinheiro Físico', type: 'CASH' }] }
                    }
                });
            } else if (!user.googleId) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId: profile.id, avatarUrl: profile.photos?.[0].value }
                });
            }

            return done(null, { ...user, googleAccessToken: accessToken });
        } catch (err) {
            return done(err, undefined);
        }
    }
));

passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));