import React, { useState, useEffect, useMemo, useCallback } from 'react';
import cls from 'classnames';
import { Button, Input, message } from 'antd';
import { CommentProvider } from '@/providers/comment';
import { useToggle } from '@/hooks/useToggle';
import { useAsyncLoading } from '@/hooks/useAsyncLoading';
import { IUser, isValidUser, UserInfo, UserInfoProps } from '../UserInfo';
import { Emoji } from './Emoji';
import styles from './index.module.scss';

const { TextArea } = Input;

interface Props {
  hostId: string;
  parentComment?: IComment;
  replyComment?: IComment;
  onOk?: () => void;
  onClose?: () => void;
  small?: boolean;
}

export const CommentEditor: React.FC<Props> = ({
  hostId,
  parentComment,
  replyComment,
  onOk,
  onClose,
  small,
}) => {
  const [addComment, loading] = useAsyncLoading(CommentProvider.addComment);
  const [needSetInfo, toggleNeedSetInfo] = useToggle(false);
  const [user, setUser] = useState<IUser | null>(null);
  const [content, setContent] = useState('');
  const hasValidUser = useMemo(() => isValidUser(user), [user]);
  const textareaPlaceholder = useMemo(
    () => (replyComment ? `回复${replyComment.name}` : '请输入评论内容（支持 Markerdown）'),
    [replyComment]
  );
  const textareaSize = useMemo(
    () => (small ? { minRows: 4, maxRows: 8 } : { minRows: 6, maxRows: 12 }),
    [small]
  );
  const btnSize = useMemo(() => (small ? 'small' : 'middle'), [small]);
  const emojiTrigger = (
    <span className={styles.emojiTrigger}>
      <svg viewBox="0 0 1024 1024" width="18px" height="18px">
        <path
          d="M288.92672 400.45568c0 30.80192 24.97024 55.77216 55.77216 55.77216s55.77216-24.97024 55.77216-55.77216c0-30.7968-24.97024-55.76704-55.77216-55.76704s-55.77216 24.97024-55.77216 55.76704z m334.60224 0c0 30.80192 24.97024 55.77216 55.77216 55.77216s55.77216-24.97024 55.77216-55.77216c0-30.7968-24.97024-55.76704-55.77216-55.76704s-55.77216 24.97024-55.77216 55.76704z m-111.5392 362.4704c-78.05952 0-156.13952-39.08096-200.75008-100.3776-16.77312-22.31296-27.84256-50.15552-39.08096-72.45824-5.53472-16.77312 5.5296-33.4592 16.77312-39.08096 16.77312-5.53472 27.84256 5.53472 33.46432 16.768 5.53472 22.30784 16.77312 39.08608 27.84256 55.77728 44.61568 55.76704 100.38272 83.69664 161.664 83.69664 61.30176 0 122.7008-27.84256 156.16-78.07488 11.15136-16.77824 22.30784-38.99904 27.84256-55.77728 5.62176-16.768 22.30784-22.30272 33.4592-16.768 16.768 5.53472 22.30784 22.30272 16.768 33.4592-5.61152 27.84256-22.2976 50.14528-39.08096 72.45824-38.912 61.37856-116.98176 100.3776-195.06176 100.3776z m0 194.51392C268.4928 957.44 66.56 755.52256 66.56 511.99488 66.56 268.48256 268.4928 66.56 511.98976 66.56 755.50208 66.56 957.44 268.48256 957.44 511.99488 957.44 755.52256 755.50208 957.44 511.98976 957.44z m0-831.45728c-213.78048 0-386.00192 172.21632-386.00192 386.01216 0 213.8112 172.22144 386.0224 386.00192 386.0224 213.80096 0 386.0224-172.2112 386.0224-386.0224 0-213.79584-172.22144-386.01216-386.0224-386.01216z"
          fill="currentColor"
        ></path>
      </svg>
      <span>表情</span>
    </span>
  );

  const storeUser = useCallback(
    (user) => {
      if (!isValidUser(user)) return;
      window.localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      toggleNeedSetInfo(false);
    },
    [toggleNeedSetInfo]
  );

  const onInput = useCallback(
    (e) => {
      if (!hasValidUser) return;
      setContent(e.target.value);
    },
    [hasValidUser]
  );

  const addEmoji = useCallback(
    (emoji) => {
      if (!hasValidUser) return;
      setContent(`${content}${emoji}`);
    },
    [content, hasValidUser]
  );

  const submit = useCallback(() => {
    const data = {
      hostId,
      ...user,
      content,
      url: window.location.pathname,
    };

    if (parentComment && parentComment.id) {
      Object.assign(data, { parentCommentId: parentComment.id });
    }

    if (replyComment) {
      Object.assign(data, {
        replyUserName: replyComment.name,
        replyUserEmail: replyComment.email,
      });
    }

    addComment(data).then(() => {
      message.success('评论成功，已提交审核');
      setContent('');
      onOk && onOk();
    });
  }, [hostId, parentComment, replyComment, onOk, user, content, toggleNeedSetInfo, addComment]);

  useEffect(() => {
    const userInfo = window.localStorage.getItem('user');
    try {
      const user = JSON.parse(userInfo) as IUser;
      setUser(user);
    } catch (err) {}
  }, []);

  return (
    <div className={cls(styles.wrapper)}>
      <UserInfo
        {...({
          visible: needSetInfo,
          onCancel: toggleNeedSetInfo,
          onOk: storeUser,
        } as UserInfoProps)}
      />
      <div className={styles.textareaWrapper}>
        {!hasValidUser && <div className={styles.mask} onClick={toggleNeedSetInfo}></div>}
        <TextArea
          placeholder={textareaPlaceholder}
          autoSize={textareaSize}
          value={content}
          onChange={onInput}
        />
      </div>
      <footer>
        {hasValidUser ? (
          <Emoji onClickEmoji={addEmoji}>{emojiTrigger}</Emoji>
        ) : (
          <div onClick={toggleNeedSetInfo}>{emojiTrigger}</div>
        )}
        <div>
          {onClose && (
            <Button onClick={onClose} style={{ marginRight: 16 }} size={btnSize}>
              收起
            </Button>
          )}
          <Button
            loading={loading}
            onClick={submit}
            type="primary"
            disabled={!content}
            size={btnSize}
          >
            发布
          </Button>
        </div>
      </footer>
    </div>
  );
};