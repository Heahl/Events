import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'E-Mail ist ein Pflichtfeld'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Ungültiges E-Mail-Format']
    },
    password: {
        type: String,
        required: [true, 'Passwort ist ein Pflichtfeld'],
        validate: {
            validator: function (v) {
                // min 12 chars
                if (v.length < 12) return false;
                // min 1 uppercase
                if (!/[A-Z]/.test(v)) return false;
                // min 1 special char
                return /[!@#$%^&*(),.\/;:<>'"{}|`~\\[\]?]/.test(v);
            },
            message: 'Passwort muss mindesten 12 Zeichen lang sein, einen Großbuchstaben und ein Sonderzeichen haben.'
        }
    }
});

// pw vor dem Speichern hashen
userSchema.pre('save', async function () {
    // nur hashen, wennn geändert
    if (!this.isModified('password')) return;

    try {
        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
    } catch (e) {
        throw e;
    }
});

const User = mongoose.model('User', userSchema);

export default User;