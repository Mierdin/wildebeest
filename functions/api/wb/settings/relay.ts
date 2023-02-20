import type { Env } from 'wildebeest/backend/src/types/env'
import * as actors from 'wildebeest/backend/src/activitypub/actors'
import type { ContextData } from 'wildebeest/backend/src/types/context'

export const onRequestPost: PagesFunction<Env, any, ContextData> = async ({ env, request }) => {
	return handleRequestPost(env.DATABASE, request)
}

type AddRelayRequest = {
	actor: string
}

export async function handleRequestPost(db: D1Database, request: Request): Promise<Response> {
	const body = await request.json<AddRelayRequest>()

	// download actor
	const actorId = new URL(body.actor)
	const actor = await actors.getAndCache(actorId, db)

	if (actor.type !== 'Application') {
		return new Response('actor is likely not a relay', { status: 400 })
	}

	// add relay
	{
		const id = crypto.randomUUID()
		await db
			.prepare(
				`
                    INSERT INTO relays (id, actor_id)
                    VALUES (?, ?)
                `
			)
			.bind(id, actor.id.toString())
			.run()
	}

	return new Response('', { status: 201 })
}
