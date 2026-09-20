// The English catalogs must cover exactly the keys of the Vietnamese ones.
export type Messages<T> = {
	[K in keyof T]: T[K] extends string ? string : Messages<T[K]>
}
