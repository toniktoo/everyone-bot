import { escape } from '../util/escapeMarkdown';

/**
 * Entity to represent a telegram user.
 */
export default class User {
    id: number;
    username: string;
    status: string;
    optIn: boolean;
    reviewLink: string;
    reviewDateTime: string;

    /**
     * @param  {Number} id - Numeric ID of the user.
     * @param  {String} username - Telegram username, without the @
     * @param  {String} status
     * @param  {String} optIn
     * @param  {String} reviewLink
     * @return {User}
     */
    constructor(id: number,
                username: string,
                status: string = 'active',
                optIn: boolean = true,
                reviewLink: string = ''
    )
    {
        if (!id) throw new SyntaxError('No ID provided for user');
        if (!username) throw new SyntaxError('No username provided for user');

        this.id = id;
        this.username = username;
        this.status = status;
        this.optIn = optIn;
        this.reviewLink = reviewLink;
        this.reviewDateTime = '';
    }

    set review(reviewLink: string) {
        this.reviewLink = reviewLink;
    }

    set setReviewDateTime(reviewDateTime: string) {
        this.reviewDateTime = reviewDateTime;
    }

    get name(): string {
        return escape(this.username)
    }

    get mention(): string {
        return `[${this.name}](tg://user?id=${this.id})`
    }

    get userStatus(): string {
        return this.status;
    }

    get params(): object {
        return {
            id: this.id,
            username: this.username,
            optIn: this.optIn,
            status: this.status,
            reviewDateTime: this.reviewDateTime,
            reviewLink: this.reviewLink
        }
    }
}
