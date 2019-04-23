import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { compose } from 'recompose'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import TopNavigation from '../omg-page-layout/TopNavigation'
import { Input, Button } from '../omg-uikit'
import ImageUploaderAvatar from '../omg-uploader/ImageUploaderAvatar'
import { currentUserProviderHoc } from '../omg-user-current/currentUserProvider'
import { updateCurrentUserEmail, updateCurrentUserAvatar } from '../omg-user-current/action'
import { updatePassword } from '../omg-session/action'

const UserSettingContainer = styled.div`
  padding-bottom: 50px;
`
const StyledInput = styled(Input)`
  margin-bottom: 30px;
`
const StyledEmailInput = styled(StyledInput)`
  margin-top: 30px;
`
const StyledRoleInput = styled(StyledInput)`
  margin-bottom: 8px;
  pointer-events: none;
  input {
    border-bottom: none;
  }
`
const Avatar = styled(ImageUploaderAvatar)`
  margin: 0;
  display: inline-block;
`
const InputsContainer = styled.div`
  display: inline-block;
  max-width: 350px;
  width: 100%;
  vertical-align: top;
`
const AvatarContainer = styled.div`
  display: inline-block;
  vertical-align: top;
  margin-right: 50px;
`
const ChangePasswordContainer = styled.div`
  margin-bottom: 30px;
  > div {
    color: ${props => props.theme.colors.B100};
  }
  a {
    color: ${props => props.theme.colors.BL400};
  }
`
const ChangePasswordFormCointainer = styled.div`
  margin-top: 20px;
`

const enhance = compose(
  currentUserProviderHoc,
  connect(
    null,
    { updateCurrentUserAvatar, updateCurrentUserEmail, updatePassword }
  ),
  withRouter
)

class UserSettingPage extends Component {
  static propTypes = {
    updatePassword: PropTypes.func.isRequired,
    updateCurrentUserEmail: PropTypes.func.isRequired,
    updateCurrentUserAvatar: PropTypes.func.isRequired,
    loadingStatus: PropTypes.string,
    currentUser: PropTypes.object,
    divider: PropTypes.bool
  }
  state = {
    email: '',
    globalRole: '',
    submitStatus: 'DEFAULT',
    changingPassword: false,
    newEmailSubmitted: false
  }

  componentDidMount () {
    this.setInitialCurrentUserState(this.props)
  }
  UNSAFE_componentWillReceiveProps = props => {
    this.setInitialCurrentUserState(props)
  }
  setInitialCurrentUserState = props => {
    if (props.loadingStatus === 'SUCCESS' && !this.state.currentUserLoaded) {
      this.setState({
        email: props.currentUser.email,
        globalRole: props.currentUser.global_role,
        avatarPlaceholder: props.currentUser.avatar.original,
        currentUserLoaded: true
      })
    }
  }
  onChangeImage = ({ file }) => {
    this.setState({ image: file })
  }
  onChangeEmail = e => {
    this.setState({
      email: e.target.value.trim(),
      newEmailSubmitted: false
    })
  }
  onChangeOldPassword = e => {
    this.setState({ oldPassword: e.target.value })
  }
  onChangeNewPassword = e => {
    this.setState({ newPassword: e.target.value })
  }
  onChangeNewPasswordConfirmation = e => {
    this.setState({ newPasswordConfirmation: e.target.value })
  }

  onClickUpdateAccount = async e => {
    e.preventDefault()
    this.setState({ submitStatus: 'SUBMITTING' })

    try {
      // update email
      if (this.state.email !== this.props.currentUser.email) {
        const updateEmailResult = await this.props.updateCurrentUserEmail({ email: this.state.email })
        if (updateEmailResult.data) {
          this.setState({ newEmailSubmitted: true })
        } else {
          throw new Error('failed email update')
        }
      }

      // update avatar
      if (this.state.image) {
        const updateAvatarResult = await this.props.updateCurrentUserAvatar({ avatar: this.state.image })
        if (!updateAvatarResult.data) {
          throw new Error('failed avatar update')
        }
      }

      // update password
      if (
        this.state.changingPassword &&
        this.state.newPassword === this.state.newPasswordConfirmation &&
        this.state.newPassword &&
        this.state.newPasswordConfirmation
      ) {
        const updatePasswordResult = await this.props.updatePassword({
          oldPassword: this.state.oldPassword,
          password: this.state.newPassword,
          passwordConfirmation: this.state.newPasswordConfirmation
        })
        if (!updatePasswordResult.data) {
          throw new Error('failed password update')
        }
      }

      // submission success
      this.setState({
        submitStatus: 'SUBMITTED',
        image: null,
        changingPassword: false,
        newPassword: '',
        newPasswordConfirmation: ''
      })
    } catch (error) {
      this.setState({ submitStatus: 'FAILED' })
    }
  }

  onClickChangePassword = e => {
    this.setState({ changingPassword: true })
  }

  render () {
    return (
      <UserSettingContainer>
        <TopNavigation
          divider={this.props.divider}
          title={'My Profile'}
          secondaryAction={false}
        />
        {this.props.loadingStatus === 'SUCCESS' && (
          <form onSubmit={this.onClickUpdateAccount} noValidate>
            <AvatarContainer>
              <Avatar
                onChangeImage={this.onChangeImage}
                size='180px'
                placeholder={this.state.avatarPlaceholder}
              />
            </AvatarContainer>
            <InputsContainer>
              <StyledEmailInput
                placeholder={'Email'}
                value={this.state.email}
                prefill
                onChange={this.onChangeEmail}
              />
              <StyledRoleInput
                placeholder={'Global Role'}
                value={_.startCase(this.state.globalRole)}
                prefill
              />
              <ChangePasswordContainer>
                <div>Password</div>
                {this.state.changingPassword ? (
                  <ChangePasswordFormCointainer>
                    <StyledInput
                      normalPlaceholder={'Old Password'}
                      value={this.state.oldPassword}
                      onChange={this.onChangeOldPassword}
                      type='password'
                    />
                    <StyledInput
                      normalPlaceholder={'New Password'}
                      value={this.state.newPassword}
                      onChange={this.onChangeNewPassword}
                      type='password'
                    />
                    <StyledInput
                      normalPlaceholder={'New Password Confirmation'}
                      value={this.state.newPasswordConfirmation}
                      onChange={this.onChangeNewPasswordConfirmation}
                      type='password'
                    />
                  </ChangePasswordFormCointainer>
                ) : (
                  <a onClick={this.onClickChangePassword}>Change password</a>
                )}
              </ChangePasswordContainer>
              <Button
                size='small'
                type='submit'
                key={'save'}
                disabled={
                  !this.state.image &&
                  (this.state.newEmailSubmitted || this.state.email === this.props.currentUser.email) &&
                  (this.state.newPassword !== this.state.newPasswordConfirmation ||
                    !this.state.newPassword ||
                    !this.state.newPasswordConfirmation)
                }
                loading={this.state.submitStatus === 'SUBMITTING'}
              >
                Save Changes
              </Button>
            </InputsContainer>
          </form>
        )}
      </UserSettingContainer>
    )
  }
}
export default enhance(UserSettingPage)
