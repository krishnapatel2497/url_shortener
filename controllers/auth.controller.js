export const getRegisterPage = (req, res) => {
  return res.render("auth/register"); //auth folder-page:register
};

export const getLoginPage = (req, res) => {
  return res.render("auth/login"); //auth folder-page:login
};
