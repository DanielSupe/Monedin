/**
 * Las piezas del sistema de diseño de Monedín.
 *
 * Esta lista es el contrato: un test enumera lo que se exporta aquí y falla si
 * una pieza no aparece en el catálogo vivo. Es lo que impide que el catálogo
 * envejezca, que es como muere un sistema de diseño.
 *
 * Regla que ningún archivo de esta carpeta puede romper: una pieza NO importa
 * nada de `features/` ni de `api/`. Por eso se puede montar en un test sin
 * servidor, sin sesión y sin datos, y por eso el catálogo no necesita
 * proveedores. Hay un test que lo comprueba.
 */

export { Alert, type AlertProps, type AlertTone } from "./Alert.js";
export { Avatar, type AvatarProps, type AvatarShape, type AvatarSize } from "./Avatar.js";
export { Badge, type BadgeProps, type BadgeTone } from "./Badge.js";
export { Button, buttonClasses, type ButtonProps, type ButtonVariant } from "./Button.js";
export { Card, type CardProps } from "./Card.js";
export { Coins, type CoinsProps } from "./Coins.js";
export { Dialog, type DialogProps } from "./Dialog.js";
export { EmptyState, type EmptyStateProps } from "./EmptyState.js";
export { Field, type FieldProps, useField } from "./Field.js";
export { Input, type InputProps } from "./Input.js";
export { Logo, type LogoProps, type LogoSize } from "./Logo.js";
export { ProgressBar, type ProgressBarProps } from "./ProgressBar.js";
export { Select, type SelectProps } from "./Select.js";
export { Skeleton, type SkeletonProps } from "./Skeleton.js";
export { Tabs, type TabItem, type TabsProps } from "./Tabs.js";
export { Toast, ToastProvider, type ToastProps, type ToastTone } from "./Toast.js";

export { AVATAR_OPTIONS, avatarGlyph, isAvatarUrl } from "./avatars.js";
export { cx } from "./cx.js";
